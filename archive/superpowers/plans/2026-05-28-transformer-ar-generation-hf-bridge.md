# Transformer AR Generation + HuggingFace Bridge — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add true autoregressive (GPT-style) text generation to the from-scratch `Transformer` class, plus offline readers for HuggingFace WordPiece vocab and pretrained word vectors.

**Architecture:** Pure PRG, no C changes, no full lib rebuild. Causal masking already supported by `hb_ScaledDotAttention` (mask added to scores). Add a parallel AR code path (`ForwardSeq`/`BackwardSeq`/`Generate`) that builds a causal mask and projects every sequence position to vocab logits (no mean-pool). Existing pool-head `Forward`/`Backward` stay untouched. Persistence via `hb_Serialize`. New `TWordPiece` tokenizer + `HFReadVec` reader live in a new `twordpiece.prg`.

**Tech Stack:** Harbour, FiveWin (FWH), `matrixes.c` C-accelerated matrix ops, `hbmk2`, BCC32.

---

## Spec

`docs/superpowers/specs/2026-05-28-transformer-ar-generation-hf-bridge-design.md`

## File Structure

- `source/classes/transformer.prg` (MODIFY) — add VARs `last_seq_x`, `last_logits`; methods `ForwardSeq`, `BackwardSeq`, `Generate`, `Save`, `Load`; static funcs `CausalMask`, `SampleLogits`, `TopKIndices`; public func `CrossEntropyLossSeq`. Existing methods unchanged.
- `source/classes/twordpiece.prg` (CREATE) — `CLASS TWordPiece` (`Load`/`Encode`/`Decode`) + static `WP_BasicSplit` + public func `HFReadVec`.
- `fwh.hbp` (MODIFY) — register `twordpiece.prg`.
- `samples/ai/transftest.prg` (CREATE) — headless test harness; writes PASS/FAIL to `transftest.log`. Grows one test per task.
- `samples/ai/transfgen.prg` (CREATE) — integration sample: train AR LM on `shakespeare.txt`, save, generate.
- `whatsnew.txt`, `docs/en/ai/ttransformer.html` (MODIFY) — document new API.

---

## Common Commands (referenced by every task)

These are the exact, repeated procedures. Run from a `cmd.exe`-style shell (the
project shell is PowerShell; the Bash tool is also available — use whichever, the
commands below are plain Windows commands).

**[REBUILD-LIB]** — recompile `FiveH.lib` after editing `transformer.prg` / `twordpiece.prg` (incremental — only changed PRGs recompile):

```
cd /d C:\fwteam
set "PATH=c:\bcc77\bin;%PATH%"
c:\harbour\bin\win\bcc\hbmk2.exe fwh.hbp -comp=bcc
```

Expected tail: a `FiveH.lib` archive update with no `Error`/`Warning W...` lines that mention `transformer` or `twordpiece`. If it prints compile errors, fix before continuing.

**[BUILD-RUN-TEST]** — build the headless test harness and run it, capturing the log. `FW_NORUN=1` stops `build_new.bat` from auto-launching; we launch explicitly and wait:

```
cd /d C:\fwteam\samples\ai
set FW_NORUN=1
call ..\build_new.bat transftest hb32
del transftest.log 2>nul
start /wait transftest.exe
type transftest.log
```

Expected: `type transftest.log` prints one `PASS: <name>` line per test, no `FAIL:` lines.

**[COMMIT]** — stage only the files the task changed:

```
cd /d C:\fwteam
git add <files listed in the task>
git commit -m "<message>"
```

Co-author every commit message with the trailer (project convention):
`Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`

---

## Task 0: Create the headless test harness skeleton

**Files:**
- Create: `samples/ai/transftest.prg`

- [ ] **Step 1: Write the harness skeleton**

`samples/ai/transftest.prg`:

```xbase
#include "FiveWin.ch"

// Headless test harness for the Transformer AR/HF additions.
// Runs every Test* function, writes PASS/FAIL lines to transftest.log,
// then exits (no GUI window). Verify by reading transftest.log.

STATIC s_cLog := ""

FUNCTION Main()
   hb_SeedRand( 12345 )   // deterministic
   TestHarnessSmoke()
   hb_MemoWrit( "transftest.log", s_cLog )
RETURN NIL

// Records a result line. lOK .T. -> PASS, .F. -> FAIL.
FUNCTION TLog( cName, lOK, cExtra )
   DEFAULT cExtra := ""
   s_cLog += IIf( lOK, "PASS: ", "FAIL: " ) + cName + ;
             IIf( Empty( cExtra ), "", "  [" + cExtra + "]" ) + Chr(13) + Chr(10)
RETURN lOK

STATIC FUNCTION TestHarnessSmoke()
   TLog( "harness_smoke", .T. )
RETURN NIL
```

- [ ] **Step 2: Build and run, verify PASS**

Run **[BUILD-RUN-TEST]**.
Expected `transftest.log`:
```
PASS: harness_smoke
```

- [ ] **Step 3: Commit**

**[COMMIT]** files: `samples/ai/transftest.prg`
Message: `test: add headless Transformer test harness`

---

## Task 1: CausalMask static function + class VARs

**Files:**
- Modify: `source/classes/transformer.prg` (VAR line near top of `CLASS Transformer`; add static func near other statics ~L532)
- Modify: `samples/ai/transftest.prg`

- [ ] **Step 1: Add the new VARs to CLASS Transformer**

In `source/classes/transformer.prg`, the class header currently has:

```xbase
   VAR last_src, last_avg_output
```

Change it to:

```xbase
   VAR last_src, last_avg_output
   VAR last_seq_x, last_logits
```

Also add the new method/func prototypes to the class body (after `METHOD zero_grad()`):

```xbase
   METHOD ForwardSeq( src_indices, pos_indices )
   METHOD BackwardSeq( d_logits, src_indices, pos_indices )
   METHOD Generate( aSeedIdx, nNew, nTemp, nTopK )
   METHOD Save( cFile )
   METHOD Load( cFile )
```

- [ ] **Step 2: Add the CausalMask static function**

In `source/classes/transformer.prg`, just before `STATIC FUNCTION SinusoidalPositional`:

```xbase
// Causal (look-ahead) mask: seq_len x seq_len.
// 0.0 where attention is allowed (j <= i), large negative where masked (j > i).
STATIC FUNCTION CausalMask( seq_len )
    LOCAL m, i, j
    m := hb_MatrixZero( seq_len, seq_len )
    for i := 1 to seq_len
        for j := 1 to seq_len
            if j > i
                m[ i ][ j ] := -1e9
            endif
        next
    next
RETURN m
```

- [ ] **Step 3: Add the test**

In `samples/ai/transftest.prg`, add a call inside `Main` after `TestHarnessSmoke()`:

```xbase
   TestCausalMask()
```

And add the function:

```xbase
STATIC FUNCTION TestCausalMask()
   LOCAL m, lOK
   m := __CallStatic_CausalMask( 3 )
   // expect: row1 = {0, -1e9, -1e9}; row2 = {0,0,-1e9}; row3 = {0,0,0}
   lOK := m[1][1] == 0 .AND. m[1][2] < -1e8 .AND. m[1][3] < -1e8 .AND. ;
          m[2][1] == 0 .AND. m[2][2] == 0   .AND. m[2][3] < -1e8 .AND. ;
          m[3][1] == 0 .AND. m[3][2] == 0   .AND. m[3][3] == 0
   TLog( "causal_mask", lOK )
RETURN NIL
```

`CausalMask` is STATIC (module-private) so the test cannot call it directly.
Add a thin public wrapper in `transformer.prg` right after `CausalMask`:

```xbase
// Public test/diagnostic wrapper for the module-static CausalMask().
FUNCTION __CallStatic_CausalMask( seq_len )
RETURN CausalMask( seq_len )
```

- [ ] **Step 4: Rebuild lib, run test**

Run **[REBUILD-LIB]** then **[BUILD-RUN-TEST]**.
Expected new line in `transftest.log`: `PASS: causal_mask`

- [ ] **Step 5: Commit**

**[COMMIT]** files: `source/classes/transformer.prg samples/ai/transftest.prg`
Message: `feat: add CausalMask + last_seq_x/last_logits VARs to Transformer`

---

## Task 2: ForwardSeq (per-position logits, causal)

**Files:**
- Modify: `source/classes/transformer.prg`
- Modify: `samples/ai/transftest.prg`

- [ ] **Step 1: Add ForwardSeq method**

In `source/classes/transformer.prg`, after `METHOD Forward(...) ... RETURN probs` (the existing pool-head method), add:

```xbase
// Autoregressive forward: causal self-attention, per-position vocab logits.
// Returns probs3D[batch][seq][vocab]. Caches ::last_seq_x and ::last_logits.
METHOD ForwardSeq( src_indices, pos_indices ) CLASS Transformer
    LOCAL src_emb, pos_emb, x, x_res, i, b, seq_len, mask
    LOCAL logits3D, probs3D

    if ValType(src_indices) != "A" .or. Len(src_indices) == 0 .or. ;
       ValType(pos_indices) != "A" .or. Len(pos_indices) == 0
        RETURN {}
    endif

    src_emb := EmbeddingLookup( ::Embedding, src_indices, ::aVocab, ::d_model )
    pos_emb := PositionalLookup( ::Positional, pos_indices )

    if ValType(src_emb) != "A" .or. Len(src_emb) == 0 .or. ;
       ValType(pos_emb) != "A" .or. Len(pos_emb) == 0
        RETURN {}
    endif

    x := hb_Matrix3DAdd( src_emb, pos_emb )
    ::last_src := x
    seq_len := Len( x[1] )
    mask := CausalMask( seq_len )

    for i := 1 to ::num_layers
        x_res := x
        x := ::layers[i]:Forward( x, x, x, mask )
        x := hb_Matrix3DAdd( x, x_res )
        x := ::norm1[i]:Forward( x )

        x_res := x
        x := ::ff_layers[i]:Forward( x )
        x := hb_Matrix3DAdd( x, x_res )
        x := ::norm2[i]:Forward( x )
    next

    ::last_seq_x := x   // [batch][seq][d_model] feeding the vocab projection

    logits3D := Array( Len(x) )
    probs3D  := Array( Len(x) )
    for b := 1 to Len(x)
        logits3D[b] := hb_MatrixMultiply( x[b], ::W_vocab )   // [seq][vocab]
        probs3D[b]  := hb_Softmax( logits3D[b] )              // row-wise per position
    next
    ::last_logits := logits3D
RETURN probs3D
```

- [ ] **Step 2: Add the test (shape + causal property)**

In `samples/ai/transftest.prg`, add `TestForwardSeq()` to `Main` and define:

```xbase
STATIC FUNCTION TestForwardSeq()
   LOCAL oT, vocab, probs, p2, lShape, lCausal, t
   vocab := { "a", "b", "c", "d", "e" }
   oT := Transformer():New( 1, 6, 1, Len(vocab), 8, NIL, vocab )

   // src/pos for one sentence of length 4
   probs := oT:ForwardSeq( { { 1, 2, 3, 4 } }, { { 1, 2, 3, 4 } } )
   lShape := ValType(probs) == "A" .AND. Len(probs) == 1 .AND. ;
             Len(probs[1]) == 4 .AND. Len(probs[1][1]) == Len(vocab)

   // Causal property: changing the LAST token must NOT change position-1 logits.
   oT:ForwardSeq( { { 1, 2, 3, 4 } }, { { 1, 2, 3, 4 } } )
   p2 := AClone( oT:last_logits[1][1] )            // pos-1 logits, seq ends with 4
   oT:ForwardSeq( { { 1, 2, 3, 5 } }, { { 1, 2, 3, 4 } } )
   lCausal := .T.
   for t := 1 to Len(p2)
      if Abs( p2[t] - oT:last_logits[1][1][t] ) > 0.000001
         lCausal := .F.
      endif
   next

   TLog( "forwardseq_shape", lShape )
   TLog( "forwardseq_causal", lCausal )
RETURN NIL
```

- [ ] **Step 3: Rebuild lib, run test**

Run **[REBUILD-LIB]** then **[BUILD-RUN-TEST]**.
Expected: `PASS: forwardseq_shape` and `PASS: forwardseq_causal`.

- [ ] **Step 4: Commit**

**[COMMIT]** files: `source/classes/transformer.prg samples/ai/transftest.prg`
Message: `feat: add Transformer:ForwardSeq (causal per-position logits)`

---

## Task 3: CrossEntropyLossSeq

**Files:**
- Modify: `source/classes/transformer.prg`
- Modify: `samples/ai/transftest.prg`

- [ ] **Step 1: Add the per-position loss function**

In `source/classes/transformer.prg`, after the existing `FUNCTION CrossEntropyLoss(...)`:

```xbase
// Per-position cross-entropy for AR training.
// probs3D[batch][seq][vocab], targets2D[batch][seq] (next-token ids).
// Target ids < 1 or > vocab are skipped (padding).
// Returns { avg_loss, grad3D } where grad3D[b][t] = probs - onehot.
FUNCTION CrossEntropyLossSeq( probs3D, targets2D )
    LOCAL batch, seq, vocab, b, t, i, idx
    LOCAL loss := 0.0, nValid := 0, eps := 1e-8
    LOCAL grad3D

    batch := Len( probs3D )
    seq   := Len( probs3D[1] )
    vocab := Len( probs3D[1][1] )
    grad3D := Array( batch )

    for b := 1 to batch
        grad3D[b] := Array( seq )
        for t := 1 to seq
            grad3D[b][t] := Array( vocab )
            AFill( grad3D[b][t], 0.0 )
            idx := targets2D[b][t]
            if idx >= 1 .and. idx <= vocab
                loss -= Log( probs3D[b][t][idx] + eps )
                for i := 1 to vocab
                    grad3D[b][t][i] := probs3D[b][t][i]
                next
                grad3D[b][t][idx] -= 1.0
                nValid++
            endif
        next
    next
    if nValid > 0
        loss /= nValid
    endif
RETURN { loss, grad3D }
```

- [ ] **Step 2: Add the test**

In `samples/ai/transftest.prg`, add `TestCELossSeq()` to `Main` and define:

```xbase
STATIC FUNCTION TestCELossSeq()
   LOCAL probs, res, lOK
   // batch=1, seq=2, vocab=3 ; perfect prediction -> ~0 loss
   probs := { { { 0.98, 0.01, 0.01 }, { 0.01, 0.98, 0.01 } } }
   res := CrossEntropyLossSeq( probs, { { 1, 2 } } )
   // grad[b][t] = probs - onehot ; check grad[1][1][1] = 0.98 - 1 = -0.02
   lOK := res[1] < 0.05 .AND. ;
          Len(res[2]) == 1 .AND. Len(res[2][1]) == 2 .AND. Len(res[2][1][1]) == 3 .AND. ;
          Abs( res[2][1][1][1] - (-0.02) ) < 0.0001 .AND. ;
          Abs( res[2][1][2][2] - (-0.02) ) < 0.0001
   TLog( "celoss_seq", lOK )
RETURN NIL
```

- [ ] **Step 3: Rebuild lib, run test**

Run **[REBUILD-LIB]** then **[BUILD-RUN-TEST]**.
Expected: `PASS: celoss_seq`.

- [ ] **Step 4: Commit**

**[COMMIT]** files: `source/classes/transformer.prg samples/ai/transftest.prg`
Message: `feat: add CrossEntropyLossSeq for per-position AR loss`

---

## Task 4: BackwardSeq + overfit (loss decreases)

**Files:**
- Modify: `source/classes/transformer.prg`
- Modify: `samples/ai/transftest.prg`

- [ ] **Step 1: Add BackwardSeq method**

In `source/classes/transformer.prg`, after `ForwardSeq`:

```xbase
// Autoregressive backward. d_logits[batch][seq][vocab] = dL/dlogits.
// Reuses layer 3D Backward; accumulates dW_vocab, embedding and positional grads.
METHOD BackwardSeq( d_logits, src_indices, pos_indices ) CLASS Transformer
    LOCAL d_x, d_seq, d_res, i, b, t, j, idx, pos_idx, tok, current_grad

    d_x := Array( Len( d_logits ) )
    for b := 1 to Len( d_logits )
        // dW_vocab += last_seq_x[b]^T . d_logits[b]
        ::dW_vocab := hb_MatrixAdd( ::dW_vocab, ;
            hb_MatrixMultiply( hb_MatrixTranspose( ::last_seq_x[b] ), d_logits[b] ) )
        // d into the stack: d_logits[b] . W_vocab^T  -> [seq][d_model]
        d_x[b] := hb_MatrixMultiply( d_logits[b], hb_MatrixTranspose( ::W_vocab ) )
    next
    d_seq := d_x

    for i := ::num_layers to 1 step -1
        d_seq := ::norm2[i]:Backward( d_seq )
        d_res := d_seq
        d_seq := ::ff_layers[i]:Backward( d_seq )
        hb_Matrix3DInplaceAdd( d_seq, d_res )

        d_seq := ::norm1[i]:Backward( d_seq )
        d_res := d_seq
        d_seq := ::layers[i]:Backward( d_seq )
        hb_Matrix3DInplaceAdd( d_seq, d_res )
    next

    for b := 1 to Len( src_indices )
        for t := 1 to Len( src_indices[1] )
            idx := src_indices[b][t]
            tok := ::aVocab[ idx ]
            current_grad := HGet( ::dEmbedding, tok )
            for j := 1 to ::d_model
                current_grad[1][j] += d_seq[b][t][j]
            next
            HSet( ::dEmbedding, tok, current_grad )
            pos_idx := pos_indices[b][t]
            for j := 1 to ::d_model
                ::dPositional[pos_idx][j] += d_seq[b][t][j]
            next
        next
    next
RETURN Self
```

- [ ] **Step 2: Add overfit test (train one sentence, loss must drop)**

In `samples/ai/transftest.prg`, add `TestOverfit()` to `Main` and define. This
also adds a shared helper `BuildOverfitModel()` used by later tasks:

```xbase
// Trains a tiny AR model to memorize one sequence. Returns the model.
// Sequence: tokens 1 2 3 4 5 ; predict-next pairs (shifted by one).
STATIC FUNCTION BuildOverfitModel( nEpochs )
   LOCAL oT, oOpt, vocab, src, pos, tgt, e, probs, res
   DEFAULT nEpochs := 200
   vocab := { "<p>", "a", "b", "c", "d", "e" }   // ids 1..6
   oT := Transformer():New( 1, 8, 2, Len(vocab), 8, NIL, vocab )
   oOpt := Optimizer_Adam():New( oT, 0.01 )
   src := { { 2, 3, 4, 5 } }   // a b c d
   pos := { { 1, 2, 3, 4 } }
   tgt := { { 3, 4, 5, 6 } }   // b c d e  (next-token)
   for e := 1 to nEpochs
      oOpt:zero_grad()
      probs := oT:ForwardSeq( src, pos )
      res := CrossEntropyLossSeq( probs, tgt )
      oT:BackwardSeq( res[2], src, pos )
      oOpt:step()
   next
RETURN oT

STATIC FUNCTION TestOverfit()
   LOCAL oT, oOpt, vocab, src, pos, tgt, loss0, loss1, probs, res
   vocab := { "<p>", "a", "b", "c", "d", "e" }
   oT := Transformer():New( 1, 8, 2, Len(vocab), 8, NIL, vocab )
   oOpt := Optimizer_Adam():New( oT, 0.01 )
   src := { { 2, 3, 4, 5 } } ; pos := { { 1, 2, 3, 4 } } ; tgt := { { 3, 4, 5, 6 } }

   probs := oT:ForwardSeq( src, pos )
   loss0 := CrossEntropyLossSeq( probs, tgt )[1]

   // 200 steps
   LOCAL e
   for e := 1 to 200
      oOpt:zero_grad()
      probs := oT:ForwardSeq( src, pos )
      res := CrossEntropyLossSeq( probs, tgt )
      oT:BackwardSeq( res[2], src, pos )
      oOpt:step()
   next
   probs := oT:ForwardSeq( src, pos )
   loss1 := CrossEntropyLossSeq( probs, tgt )[1]

   TLog( "overfit_loss_drops", loss1 < loss0 * 0.25, ;
         "loss0=" + Str(loss0,8,4) + " loss1=" + Str(loss1,8,4) )
RETURN NIL
```

- [ ] **Step 3: Rebuild lib, run test**

Run **[REBUILD-LIB]** then **[BUILD-RUN-TEST]**.
Expected: `PASS: overfit_loss_drops` (loss1 well below loss0). If it FAILs, the
bracketed `loss0/loss1` values in the log diagnose convergence.

- [ ] **Step 4: Commit**

**[COMMIT]** files: `source/classes/transformer.prg samples/ai/transftest.prg`
Message: `feat: add Transformer:BackwardSeq + AR overfit test`

---

## Task 5: Generation (sampling) — Generate / SampleLogits / TopKIndices

**Files:**
- Modify: `source/classes/transformer.prg`
- Modify: `samples/ai/transftest.prg`

- [ ] **Step 1: Add TopKIndices + SampleLogits statics**

In `source/classes/transformer.prg`, before `STATIC FUNCTION SinusoidalPositional`:

```xbase
// Indices of the k largest values in a 1D numeric array.
STATIC FUNCTION TopKIndices( aVals, k )
    LOCAL aIdx := {}, aUsed, n := Len( aVals ), i, j, nMax, nMaxIdx
    aUsed := Array( n )
    AFill( aUsed, .F. )
    for i := 1 to Min( k, n )
        nMax := -1e30 ; nMaxIdx := 1
        for j := 1 to n
            if !aUsed[j] .and. aVals[j] > nMax
                nMax := aVals[j] ; nMaxIdx := j
            endif
        next
        AAdd( aIdx, nMaxIdx ) ; aUsed[ nMaxIdx ] := .T.
    next
RETURN aIdx

// Sample one index from raw logits with temperature + optional top-k.
// nTopK == 0 -> use full distribution.
STATIC FUNCTION SampleLogits( logits, nTemp, nTopK )
    LOCAL n := Len( logits ), i, scaled, probs, mx, s, aIdx, keep, r, cum, pick
    DEFAULT nTemp := 1.0, nTopK := 0
    if nTemp <= 0 ; nTemp := 1.0 ; endif

    scaled := Array( n )
    for i := 1 to n ; scaled[i] := logits[i] / nTemp ; next

    mx := scaled[1]
    for i := 2 to n ; if scaled[i] > mx ; mx := scaled[i] ; endif ; next
    probs := Array( n ) ; s := 0.0
    for i := 1 to n ; probs[i] := Exp( scaled[i] - mx ) ; s += probs[i] ; next
    for i := 1 to n ; probs[i] /= s ; next

    if nTopK > 0 .and. nTopK < n
        aIdx := TopKIndices( probs, nTopK )
        keep := Array( n ) ; AFill( keep, .F. )
        for i := 1 to Len( aIdx ) ; keep[ aIdx[i] ] := .T. ; next
        s := 0.0
        for i := 1 to n
            if !keep[i] ; probs[i] := 0.0 ; else ; s += probs[i] ; endif
        next
        if s > 0 ; for i := 1 to n ; probs[i] /= s ; next ; endif
    endif

    r := hb_Random()   // 0 <= r < 1
    cum := 0.0 ; pick := 1
    for i := 1 to n
        cum += probs[i]
        if r <= cum ; pick := i ; EXIT ; endif
    next
RETURN pick
```

- [ ] **Step 2: Add Generate method**

After `BackwardSeq`:

```xbase
// Autoregressive generation. aSeedIdx = 1D array of starting token ids.
// Returns the full id array (seed + nNew generated). nTopK==0 => full dist.
METHOD Generate( aSeedIdx, nNew, nTemp, nTopK ) CLASS Transformer
    LOCAL aSeq, k, window, pos, i, probs3D, logits, nIdx
    DEFAULT nNew := 20, nTemp := 1.0, nTopK := 0
    aSeq := AClone( aSeedIdx )

    for k := 1 to nNew
        if Len( aSeq ) > ::max_seq_len
            window := {}
            for i := Len( aSeq ) - ::max_seq_len + 1 to Len( aSeq )
                AAdd( window, aSeq[i] )
            next
        else
            window := AClone( aSeq )
        endif
        pos := Array( Len( window ) )
        for i := 1 to Len( window ) ; pos[i] := i ; next

        probs3D := ::ForwardSeq( { window }, { pos } )
        if ValType( probs3D ) != "A" .or. Len( probs3D ) == 0 ; EXIT ; endif

        logits := ::last_logits[1][ Len( window ) ]   // last position raw logits
        nIdx := SampleLogits( logits, nTemp, nTopK )
        AAdd( aSeq, nIdx )
    next
RETURN aSeq
```

- [ ] **Step 3: Add the test (greedy reproduces overfit continuation)**

In `samples/ai/transftest.prg`, add `TestGenerate()` to `Main` and define:

```xbase
STATIC FUNCTION TestGenerate()
   LOCAL oT, aOut, lOK
   oT := BuildOverfitModel( 300 )      // memorized: a b c d -> b c d e
   // Greedy (top-1): seed "a b c" (ids 2,3,4) should continue with d,e (ids 5,6)
   aOut := oT:Generate( { 2, 3, 4 }, 2, 0.0001, 1 )
   lOK := Len( aOut ) == 5 .AND. aOut[4] == 5 .AND. aOut[5] == 6
   TLog( "generate_greedy", lOK, ;
         "out=" + hb_ValToExp( aOut ) )
RETURN NIL
```

- [ ] **Step 4: Rebuild lib, run test**

Run **[REBUILD-LIB]** then **[BUILD-RUN-TEST]**.
Expected: `PASS: generate_greedy`. The bracketed `out=` array shows the produced ids if it FAILs.

- [ ] **Step 5: Commit**

**[COMMIT]** files: `source/classes/transformer.prg samples/ai/transftest.prg`
Message: `feat: add Transformer:Generate with temperature + top-k sampling`

---

## Task 6: Save / Load

**Files:**
- Modify: `source/classes/transformer.prg`
- Modify: `samples/ai/transftest.prg`

- [ ] **Step 1: Add Save and Load methods**

After `Generate`:

```xbase
// Serialize all learnable weights + config to a file (hb_Serialize).
METHOD Save( cFile ) CLASS Transformer
    LOCAL h := { => }, aL, i, lay
    h[ "cfg" ]        := { ::num_layers, ::d_model, ::n_heads, ::vocab_size, ::max_seq_len }
    h[ "aVocab" ]     := ::aVocab
    h[ "Embedding" ]  := ::Embedding
    h[ "Positional" ] := ::Positional
    h[ "W_vocab" ]    := ::W_vocab
    aL := Array( ::num_layers )
    for i := 1 to ::num_layers
        lay := { => }
        lay[ "WQ" ] := ::layers[i]:WQ ; lay[ "WK" ] := ::layers[i]:WK
        lay[ "WV" ] := ::layers[i]:WV ; lay[ "Wo" ] := ::layers[i]:Wo
        lay[ "W1" ] := ::ff_layers[i]:W1 ; lay[ "W2" ] := ::ff_layers[i]:W2
        lay[ "b1" ] := ::ff_layers[i]:b1 ; lay[ "b2" ] := ::ff_layers[i]:b2
        lay[ "n1g" ] := ::norm1[i]:gamma ; lay[ "n1b" ] := ::norm1[i]:beta
        lay[ "n2g" ] := ::norm2[i]:gamma ; lay[ "n2b" ] := ::norm2[i]:beta
        aL[i] := lay
    next
    h[ "layers" ] := aL
RETURN hb_MemoWrit( cFile, hb_Serialize( h ) )

// Rebuild model from a file written by Save(). Returns Self (or NIL on bad file).
METHOD Load( cFile ) CLASS Transformer
    LOCAL h, cfg, i, lay
    h := hb_Deserialize( hb_MemoRead( cFile ) )
    if ValType( h ) != "H" .or. !hb_HHasKey( h, "cfg" )
        RETURN NIL
    endif
    cfg := h[ "cfg" ]
    ::New( cfg[1], cfg[2], cfg[3], cfg[4], cfg[5], NIL, h[ "aVocab" ] )
    ::Embedding  := h[ "Embedding" ]
    ::Positional := h[ "Positional" ]
    ::W_vocab    := h[ "W_vocab" ]
    for i := 1 to ::num_layers
        lay := h[ "layers" ][i]
        ::layers[i]:WQ := lay[ "WQ" ] ; ::layers[i]:WK := lay[ "WK" ]
        ::layers[i]:WV := lay[ "WV" ] ; ::layers[i]:Wo := lay[ "Wo" ]
        ::ff_layers[i]:W1 := lay[ "W1" ] ; ::ff_layers[i]:W2 := lay[ "W2" ]
        ::ff_layers[i]:b1 := lay[ "b1" ] ; ::ff_layers[i]:b2 := lay[ "b2" ]
        ::norm1[i]:gamma := lay[ "n1g" ] ; ::norm1[i]:beta := lay[ "n1b" ]
        ::norm2[i]:gamma := lay[ "n2g" ] ; ::norm2[i]:beta := lay[ "n2b" ]
    next
RETURN Self
```

- [ ] **Step 2: Add the test (save -> load -> identical greedy generation)**

In `samples/ai/transftest.prg`, add `TestSaveLoad()` to `Main` and define:

```xbase
STATIC FUNCTION TestSaveLoad()
   LOCAL oT, oT2, a1, a2, lOK, i
   oT := BuildOverfitModel( 300 )
   oT:Save( "transftest.mdl" )

   oT2 := Transformer():New()    // defaults; Load reconfigures from file
   oT2:Load( "transftest.mdl" )

   // Greedy generation must match between original and reloaded model.
   a1 := oT:Generate(  { 2, 3, 4 }, 3, 0.0001, 1 )
   a2 := oT2:Generate( { 2, 3, 4 }, 3, 0.0001, 1 )
   lOK := Len(a1) == Len(a2)
   if lOK
      for i := 1 to Len(a1)
         if a1[i] != a2[i] ; lOK := .F. ; endif
      next
   endif
   FErase( "transftest.mdl" )
   TLog( "save_load_identical", lOK, "a1=" + hb_ValToExp(a1) + " a2=" + hb_ValToExp(a2) )
RETURN NIL
```

- [ ] **Step 3: Rebuild lib, run test**

Run **[REBUILD-LIB]** then **[BUILD-RUN-TEST]**.
Expected: `PASS: save_load_identical`.

- [ ] **Step 4: Commit**

**[COMMIT]** files: `source/classes/transformer.prg samples/ai/transftest.prg`
Message: `feat: add Transformer:Save/Load via hb_Serialize`

---

## Task 7: TWordPiece tokenizer + register in fwh.hbp

**Files:**
- Create: `source/classes/twordpiece.prg`
- Modify: `fwh.hbp`
- Modify: `samples/ai/transftest.prg`

- [ ] **Step 1: Create the tokenizer class**

`source/classes/twordpiece.prg`:

```xbase
// WordPiece tokenizer compatible with HuggingFace bert vocab.txt files.
// Plus HFReadVec(): load GloVe/fastText text vectors for embedding warm-start.

#include "FiveWin.ch"

CLASS TWordPiece
   DATA hVocab            // token -> id (1-based)
   DATA aVocab            // id -> token
   DATA cUnk     INIT "[UNK]"
   DATA nMaxChars INIT 100

   METHOD Load( cVocabTxt )
   METHOD Encode( cText )
   METHOD Decode( aIds )
ENDCLASS

// Reads a bert-style vocab.txt: one token per line; id = line number.
METHOD Load( cVocabTxt ) CLASS TWordPiece
   LOCAL aLines, i, tok
   ::hVocab := { => }
   ::aVocab := {}
   aLines := hb_ATokens( MemoRead( cVocabTxt ), Chr(10) )
   for i := 1 to Len( aLines )
      tok := StrTran( aLines[i], Chr(13), "" )
      if !Empty( tok )
         AAdd( ::aVocab, tok )
         ::hVocab[ tok ] := Len( ::aVocab )
      endif
   next
RETURN Self

// Lowercase, isolate punctuation, greedy longest-match WordPiece per word.
// Unknown word -> [UNK]. Returns array of token ids.
METHOD Encode( cText ) CLASS TWordPiece
   LOCAL aOut := {}, aWords, w, cWord, nLen, nStart, nEnd, sub, cPiece
   LOCAL subTokens, found, i
   aWords := WP_BasicSplit( Lower( AllTrim( cText ) ) )
   for w := 1 to Len( aWords )
      cWord := aWords[w]
      nLen := Len( cWord )
      if nLen == 0
         LOOP
      endif
      if nLen > ::nMaxChars
         AAdd( aOut, ::hVocab[ ::cUnk ] )
         LOOP
      endif
      subTokens := {} ; found := .T. ; nStart := 1
      do while nStart <= nLen
         nEnd := nLen ; cPiece := NIL
         do while nEnd >= nStart
            sub := SubStr( cWord, nStart, nEnd - nStart + 1 )
            if nStart > 1
               sub := "##" + sub
            endif
            if hb_HHasKey( ::hVocab, sub )
               cPiece := sub ; EXIT
            endif
            nEnd--
         enddo
         if cPiece == NIL
            found := .F. ; EXIT
         endif
         AAdd( subTokens, ::hVocab[ cPiece ] )
         nStart := nEnd + 1
      enddo
      if found
         for i := 1 to Len( subTokens )
            AAdd( aOut, subTokens[i] )
         next
      else
         AAdd( aOut, ::hVocab[ ::cUnk ] )
      endif
   next
RETURN aOut

// ids -> text. Strips "##" continuation joins.
METHOD Decode( aIds ) CLASS TWordPiece
   LOCAL c := "", i, tok
   for i := 1 to Len( aIds )
      tok := ::aVocab[ aIds[i] ]
      if Left( tok, 2 ) == "##"
         c += SubStr( tok, 3 )
      else
         c += IIf( Empty( c ), "", " " ) + tok
      endif
   next
RETURN c

// Splits on whitespace and isolates each punctuation char as its own token.
STATIC FUNCTION WP_BasicSplit( cText )
   LOCAL aOut := {}, cCur := "", i, ch
   for i := 1 to Len( cText )
      ch := SubStr( cText, i, 1 )
      if ch == " " .or. ch == Chr(9) .or. ch == Chr(13) .or. ch == Chr(10)
         if !Empty( cCur ) ; AAdd( aOut, cCur ) ; cCur := "" ; endif
      elseif ch $ ".,;:!?'" + Chr(34) + "()[]{}-/\"
         if !Empty( cCur ) ; AAdd( aOut, cCur ) ; cCur := "" ; endif
         AAdd( aOut, ch )
      else
         cCur += ch
      endif
   next
   if !Empty( cCur ) ; AAdd( aOut, cCur ) ; endif
RETURN aOut

// Loads GloVe/fastText text vectors ("token f1 f2 ... fN") into hEmb
// (token -> 1 x nDim matrix). Skips an optional fastText "count dim" header.
// Returns number of vectors loaded. hEmb must be an existing hash.
FUNCTION HFReadVec( cFile, hEmb, nDim )
   LOCAL aLines, cLine, aParts, tok, vec, i, j, n := 0
   if ValType( hEmb ) != "H"
      RETURN 0
   endif
   aLines := hb_ATokens( MemoRead( cFile ), Chr(10) )
   for i := 1 to Len( aLines )
      cLine := AllTrim( StrTran( aLines[i], Chr(13), "" ) )
      if Empty( cLine )
         LOOP
      endif
      aParts := hb_ATokens( cLine, " " )
      if Len( aParts ) == 2          // fastText header: "<count> <dim>"
         LOOP
      endif
      if Len( aParts ) != nDim + 1   // token + nDim floats
         LOOP
      endif
      tok := aParts[1]
      vec := hb_MatrixZero( 1, nDim )
      for j := 1 to nDim
         vec[1][j] := Val( aParts[j+1] )
      next
      hEmb[ tok ] := vec
      n++
   next
RETURN n
```

- [ ] **Step 2: Register twordpiece.prg in fwh.hbp**

In `fwh.hbp`, the line is:

```
source/classes/transformer.prg
```

Add immediately after it:

```
source/classes/twordpiece.prg
```

- [ ] **Step 3: Add Encode/Decode round-trip test**

The test writes a tiny vocab.txt, loads it, encodes/decodes. In
`samples/ai/transftest.prg`, add `TestWordPiece()` to `Main` and define:

```xbase
STATIC FUNCTION TestWordPiece()
   LOCAL oTok, cVocab, ids, cBack, lEnc, lDec, lUnk, idsU
   // vocab.txt: line N => id N
   cVocab := "[UNK]" + Chr(10) + "play" + Chr(10) + "##ing" + Chr(10) + ;
             "the" + Chr(10) + "cat" + Chr(10)
   hb_MemoWrit( "transftest_vocab.txt", cVocab )

   oTok := TWordPiece():New()
   oTok:Load( "transftest_vocab.txt" )

   // "playing" -> play + ##ing  (ids 2,3) ; "the" -> 4
   ids := oTok:Encode( "playing the" )
   lEnc := Len(ids) == 3 .AND. ids[1] == 2 .AND. ids[2] == 3 .AND. ids[3] == 4

   cBack := oTok:Decode( { 2, 3, 4 } )    // "playing the"
   lDec := ( cBack == "playing the" )

   // OOV word -> [UNK] (id 1)
   idsU := oTok:Encode( "zzzz" )
   lUnk := Len(idsU) == 1 .AND. idsU[1] == 1

   FErase( "transftest_vocab.txt" )
   TLog( "wordpiece_encode", lEnc, "ids=" + hb_ValToExp(ids) )
   TLog( "wordpiece_decode", lDec, "back=" + cBack )
   TLog( "wordpiece_unk",    lUnk )
RETURN NIL
```

Note: `TWordPiece` has no explicit `New()` constructor, but Harbour classes get
a default `New()` that returns an initialized instance with `DATA ... INIT`
values applied. `Load` sets `hVocab`/`aVocab`.

- [ ] **Step 4: Rebuild lib, run test**

Run **[REBUILD-LIB]** then **[BUILD-RUN-TEST]**.
Expected: `PASS: wordpiece_encode`, `PASS: wordpiece_decode`, `PASS: wordpiece_unk`.

- [ ] **Step 5: Commit**

**[COMMIT]** files: `source/classes/twordpiece.prg fwh.hbp samples/ai/transftest.prg`
Message: `feat: add TWordPiece tokenizer + HFReadVec reader`

---

## Task 8: Embedding warm-start from HF vectors

**Files:**
- Modify: `samples/ai/transftest.prg`

(`HFReadVec` already implemented in Task 7. This task verifies the warm-start
overlay pattern: build a full model so `dEmbedding` covers all vocab tokens,
then overlay loaded vectors onto `oT:Embedding` for known tokens.)

- [ ] **Step 1: Add warm-start test**

In `samples/ai/transftest.prg`, add `TestWarmStart()` to `Main` and define:

```xbase
STATIC FUNCTION TestWarmStart()
   LOCAL oT, vocab, cVec, nLoaded, lLoad, probs, lFwd
   vocab := { "a", "b", "c" }
   // d_model must equal vector dim (3 here)
   oT := Transformer():New( 1, 3, 1, Len(vocab), 8, NIL, vocab )

   // .vec text: fastText-style header then 2 known tokens
   cVec := "3 3" + Chr(10) + ;
           "a 0.1 0.2 0.3" + Chr(10) + ;
           "b 0.4 0.5 0.6" + Chr(10) + ;
           "zzz 9 9 9" + Chr(10)        // not in vocab -> harmless extra key
   hb_MemoWrit( "transftest.vec", cVec )

   nLoaded := HFReadVec( "transftest.vec", oT:Embedding, 3 )
   lLoad := nLoaded == 3 .AND. ;
            Abs( oT:Embedding[ "a" ][1][1] - 0.1 ) < 0.0001 .AND. ;
            Abs( oT:Embedding[ "b" ][1][3] - 0.6 ) < 0.0001

   // Model still runs a forward pass after overlay (no dimension error).
   probs := oT:ForwardSeq( { { 1, 2, 3 } }, { { 1, 2, 3 } } )
   lFwd := ValType(probs) == "A" .AND. Len(probs) == 1 .AND. Len(probs[1]) == 3

   FErase( "transftest.vec" )
   TLog( "warmstart_load",    lLoad, "n=" + Str(nLoaded) )
   TLog( "warmstart_forward", lFwd )
RETURN NIL
```

- [ ] **Step 2: Run test (no lib rebuild needed — only the harness changed)**

Run **[BUILD-RUN-TEST]**.
Expected: `PASS: warmstart_load`, `PASS: warmstart_forward`.

- [ ] **Step 3: Commit**

**[COMMIT]** files: `samples/ai/transftest.prg`
Message: `test: verify HFReadVec embedding warm-start overlay`

---

## Task 9: Integration sample — transfgen.prg (train + generate on shakespeare)

**Files:**
- Create: `samples/ai/transfgen.prg`

- [ ] **Step 1: Write the sample**

`samples/ai/transfgen.prg` (console-style FiveWin app; uses word tokens from
`shakespeare.txt`, trains a small AR LM, saves, generates):

```xbase
#include "FiveWin.ch"

// AR text generation demo: trains a small Transformer language model on
// samples/ai/shakespeare.txt, saves it, then generates text.
// Build:  build_new.bat transfgen hb32

FUNCTION Main()
   LOCAL cText, aWords, hVocab, aVocab, aSeqs, oT, oOpt, e, cOut
   LOCAL d_model := 32, n_heads := 4, num_layers := 2, max_seq := 16
   LOCAL nEpochs := 30, nMaxVocab := 400

   hb_SeedRand( 7 )

   cText := MemoRead( "shakespeare.txt" )
   if Empty( cText )
      MsgAlert( "shakespeare.txt not found in current folder" )
      RETURN NIL
   endif

   aWords := TG_Tokenize( cText )
   TG_BuildVocab( aWords, nMaxVocab, @hVocab, @aVocab )
   aSeqs := TG_BuildWindows( aWords, hVocab, max_seq )

   if Len( aSeqs ) == 0
      MsgAlert( "Not enough data to build training windows" )
      RETURN NIL
   endif

   oT := Transformer():New( num_layers, d_model, n_heads, Len(aVocab), max_seq, NIL, aVocab )
   oOpt := Optimizer_Adam():New( oT, 0.005 )

   cOut := "Vocab=" + LTrim(Str(Len(aVocab))) + "  Windows=" + LTrim(Str(Len(aSeqs))) + CRLF

   for e := 1 to nEpochs
      cOut += "Epoch " + Str(e,3) + "  loss=" + Str( TG_TrainEpoch( oT, oOpt, aSeqs ), 8, 4 ) + CRLF
   next

   oT:Save( "transfgen.mdl" )

   cOut += CRLF + "--- Generated (temp 0.7, top-k 5) ---" + CRLF
   cOut += TG_Generate( oT, hVocab, aVocab, "to be", 20, 0.7, 5 ) + CRLF
   cOut += TG_Generate( oT, hVocab, aVocab, "the king", 20, 0.7, 5 ) + CRLF

   MsgInfo( cOut )            // shows results; remove for headless runs
   hb_MemoWrit( "transfgen.out", cOut )
RETURN NIL

// Lowercase word + punctuation tokens.
STATIC FUNCTION TG_Tokenize( cText )
   LOCAL aOut := {}, cCur := "", i, ch
   cText := Lower( cText )
   for i := 1 to Len( cText )
      ch := SubStr( cText, i, 1 )
      if ch >= "a" .and. ch <= "z"
         cCur += ch
      else
         if !Empty( cCur ) ; AAdd( aOut, cCur ) ; cCur := "" ; endif
         if ch $ ".,;:!?'" ; AAdd( aOut, ch ) ; endif
      endif
   next
   if !Empty( cCur ) ; AAdd( aOut, cCur ) ; endif
RETURN aOut

// Builds vocab from the most-frequent tokens (cap nMax). Adds "<unk>".
STATIC FUNCTION TG_BuildVocab( aWords, nMax, hV, aV )
   LOCAL hCount := { => }, i, w, aPairs, k
   for i := 1 to Len( aWords )
      w := aWords[i]
      hCount[ w ] := IIf( hb_HHasKey( hCount, w ), hCount[ w ] + 1, 1 )
   next
   aPairs := {}
   for each k in hb_HKeys( hCount )
      AAdd( aPairs, { k, hCount[ k ] } )
   next
   ASort( aPairs,,, {| x, y | x[2] > y[2] } )

   hV := { => } ; aV := {}
   AAdd( aV, "<unk>" ) ; hV[ "<unk>" ] := 1
   for i := 1 to Min( nMax - 1, Len( aPairs ) )
      AAdd( aV, aPairs[i][1] ) ; hV[ aPairs[i][1] ] := Len( aV )
   next
RETURN NIL

// id of a token, falling back to <unk> (id 1).
STATIC FUNCTION TG_Id( hV, cTok )
RETURN IIf( hb_HHasKey( hV, cTok ), hV[ cTok ], 1 )

// Sliding windows of length max_seq; target = input shifted by one token.
STATIC FUNCTION TG_BuildWindows( aWords, hV, max_seq )
   LOCAL aSeqs := {}, i, j, src, tgt
   for i := 1 to Len( aWords ) - max_seq
      src := Array( max_seq ) ; tgt := Array( max_seq )
      for j := 1 to max_seq
         src[j] := TG_Id( hV, aWords[ i + j - 1 ] )
         tgt[j] := TG_Id( hV, aWords[ i + j ] )
      next
      AAdd( aSeqs, { src, tgt } )
      if Len( aSeqs ) >= 600 ; EXIT ; endif    // cap for demo speed
   next
RETURN aSeqs

// One training epoch over batches of size 8. Returns mean loss.
STATIC FUNCTION TG_TrainEpoch( oT, oOpt, aSeqs )
   LOCAL i, j, nBS := 8, nEnd, nCur, aBS, aBT, aBP, pos, probs, res
   LOCAL total := 0, nB := 0, max_seq := Len( aSeqs[1][1] )

   pos := Array( max_seq )
   for j := 1 to max_seq ; pos[j] := j ; next

   for i := 1 to Len( aSeqs ) step nBS
      nEnd := Min( i + nBS - 1, Len( aSeqs ) )
      nCur := nEnd - i + 1
      aBS := Array( nCur ) ; aBT := Array( nCur ) ; aBP := Array( nCur )
      for j := 1 to nCur
         aBS[j] := aSeqs[ i + j - 1 ][1]
         aBT[j] := aSeqs[ i + j - 1 ][2]
         aBP[j] := pos
      next
      oOpt:zero_grad()
      probs := oT:ForwardSeq( aBS, aBP )
      if ValType( probs ) == "A" .and. Len( probs ) > 0
         res := CrossEntropyLossSeq( probs, aBT )
         total += res[1] ; nB++
         oT:BackwardSeq( res[2], aBS, aBP )
         oOpt:step()
      endif
   next
RETURN IIf( nB > 0, total / nB, 0 )

// Generate text from a seed phrase.
STATIC FUNCTION TG_Generate( oT, hV, aV, cSeed, nNew, nTemp, nTopK )
   LOCAL aSeedIdx := {}, aWords, i, aOut, c := ""
   aWords := hb_ATokens( Lower( cSeed ), " " )
   for i := 1 to Len( aWords ) ; AAdd( aSeedIdx, TG_Id( hV, aWords[i] ) ) ; next
   aOut := oT:Generate( aSeedIdx, nNew, nTemp, nTopK )
   for i := 1 to Len( aOut ) ; c += aV[ aOut[i] ] + " " ; next
RETURN "> " + c
```

- [ ] **Step 2: Build and run**

```
cd /d C:\fwteam\samples\ai
set FW_NORUN=
call ..\build_new.bat transfgen hb32
```

`build_new.bat` auto-launches the exe. Expected: a `MsgInfo` dialog showing
decreasing per-epoch loss and two `>` generated lines, plus a `transfgen.out`
file. The generated text need not be grammatical (tiny model / few epochs); the
acceptance bar is: loss decreases across epochs and generation produces
in-vocab words without error.

- [ ] **Step 3: Commit**

**[COMMIT]** files: `samples/ai/transfgen.prg`
Message: `feat: add transfgen AR text-generation sample`

---

## Task 10: Docs + whatsnew + regression check

**Files:**
- Modify: `whatsnew.txt`
- Modify: `docs/en/ai/ttransformer.html`
- (verify) `samples/ai/transformer.prg`, `DemoTransformer()`

- [ ] **Step 1: Regression — existing pool-head path still works**

Confirm the existing classification/demo path is untouched. Rebuild lib (if not
already current) and build+run the existing demo sample:

```
cd /d C:\fwteam\samples\ai
call ..\build_new.bat transformer hb32
```

Expected: the existing `transformer.exe` demo runs as before (no regression from
the added methods). If it errors, the new code broke a shared symbol — fix
before continuing.

- [ ] **Step 2: Add whatsnew entry (TOP of current month section)**

In `whatsnew.txt`, find the current month section header and insert at the TOP
of that section (project convention — newest first):

```
   Transformer class: new autoregressive generation API.
      - METHOD ForwardSeq()/BackwardSeq(): causal self-attention, per-position
        vocab logits (GPT-style next-token training).
      - METHOD Generate( aSeedIdx, nNew, nTemp, nTopK ): temperature + top-k
        sampling.
      - METHOD Save( cFile )/Load( cFile ): persist/restore trained weights.
      - FUNCTION CrossEntropyLossSeq( probs3D, targets2D ): per-position loss.
      - New class TWordPiece (source/classes/twordpiece.prg): HuggingFace
        bert vocab.txt tokenizer (Load/Encode/Decode).
      - FUNCTION HFReadVec(): load GloVe/fastText word vectors for embedding
        warm-start.
      - New sample samples/ai/transfgen.prg.
```

- [ ] **Step 3: Add a short API section to the docs page**

In `docs/en/ai/ttransformer.html`, add a section documenting the new methods
(`ForwardSeq`, `BackwardSeq`, `Generate`, `Save`, `Load`, `CrossEntropyLossSeq`,
`TWordPiece`, `HFReadVec`). Match the page's existing dark-theme markup and
section structure (copy the format of an existing method section on that page;
do not introduce new CSS).

- [ ] **Step 4: Final full test run**

Run **[BUILD-RUN-TEST]** one more time and confirm `transftest.log` shows ALL
PASS lines and zero FAIL:

```
PASS: harness_smoke
PASS: causal_mask
PASS: forwardseq_shape
PASS: forwardseq_causal
PASS: celoss_seq
PASS: overfit_loss_drops
PASS: generate_greedy
PASS: save_load_identical
PASS: wordpiece_encode
PASS: wordpiece_decode
PASS: wordpiece_unk
PASS: warmstart_load
PASS: warmstart_forward
```

- [ ] **Step 5: Commit**

**[COMMIT]** files: `whatsnew.txt docs/en/ai/ttransformer.html`
Message: `docs: document Transformer AR generation + HF bridge API`

---

## Self-Review notes (author)

- **Spec coverage:** §1 AR path → Tasks 1-4; §2 Generation → Task 5; §3 Save/Load
  → Task 6; §4 HF bridge (TWordPiece + HFReadVec) → Tasks 7-8; §5 sample → Task 9;
  testing items 1-6 → Tasks 1,2,4,6,7,8 + regression Task 10.
- **No-C-change invariant:** every task is PRG-only; only `FiveH.lib` (prg lib)
  is rebuilt via `hbmk2 fwh.hbp`. `matrixes.c` / `FiveHC*.lib` untouched.
- **Type consistency:** `ForwardSeq` returns probs3D and caches `::last_logits`
  (raw) used by `Generate`; `CrossEntropyLossSeq` returns `{loss, grad3D}` fed to
  `BackwardSeq`; `HFReadVec(cFile, hEmb, nDim)` overlays onto an existing hash
  (warm-start pattern in Task 8, not via `New(hEmb)`, so `dEmbedding` stays
  complete). Names match across tasks.
- **Warm-start caveat:** `d_model` must equal the vector dimension; documented in
  the sample/spec and enforced by `HFReadVec` skipping mismatched lines.
```
