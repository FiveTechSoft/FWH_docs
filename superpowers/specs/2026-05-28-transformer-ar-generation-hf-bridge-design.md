# Transformer: Autoregressive Generation + HuggingFace Bridge — Design

Date: 2026-05-28
Target file: `source/classes/transformer.prg` (+ new files below)

## Goal

Enable the from-scratch `Transformer` class to (a) do true autoregressive
(GPT-style) text generation, and (b) consume HuggingFace material — subword
tokenizer vocab and pretrained word vectors — via offline file readers.

## Constraints / key facts

- **Pure PRG. No C changes. No library rebuild.**
  - Causal masking already supported end-to-end in C:
    `hb_ScaledDotAttention` adds `mask[i][j]` to scores (`matrixes.c` L1615-1616);
    `MultiHeadAttention:Backward` re-applies via `::last_mask`.
  - `hb_Serialize` / `hb_Deserialize` are Harbour stdlib.
- **Backward compatible.** Existing `Transformer:Forward` / `:Backward`
  (mean-pool head) stay untouched so the classification sample and
  `DemoTransformer()` keep working. AR is a parallel code path.
- Hash-based embeddings (`::Embedding`, token string → 1×d_model) are kept.
  No change to Adam moment keys / no optimizer refactor.
- Direct import of real GPT2/BERT weights is **out of scope** — architecture
  mismatch (GELU vs ReLU, pre-LN vs post-LN, learned pos, weight layout)
  makes it not worthwhile at d_model 8–32. HF use here = tokenizer vocab +
  warm-start vectors + training data.

## Components

### 1. Transformer class — AR path

New methods on `CLASS Transformer` (existing methods unchanged):

- `METHOD ForwardSeq( src_indices, pos_indices )`
  - Same embedding + positional + layer stack as `Forward`, BUT:
    - builds a causal mask once and passes it to every `layers[i]:Forward(x,x,x,mask)`
      instead of `NIL`.
    - **no mean-pool.** Projects each sequence position `d_model → vocab`
      through the existing `::W_vocab`, returns 3D logits
      `[batch][seq][vocab]` after per-position softmax.
  - Caches what `BackwardSeq` needs (`::last_seq_x` = the 3D activations fed to
    the vocab projection; `::last_src` already cached by the stack).
- `METHOD BackwardSeq( d_logits, src_indices, pos_indices )`
  - `d_logits` is 3D `[batch][seq][vocab]` (gradient of per-position loss).
  - Accumulates `::dW_vocab` summed over all batch×seq positions:
    `dW_vocab += last_seq_x[b][t]^T · d_logits[b][t]`.
  - Propagates `d_seq = d_logits · W_vocab^T` (3D) directly into the layer
    stack (skips `hb_Matrix3DExpand`, which the pool path uses).
  - Reuses each layer's existing 3D-aware `Backward`, plus the existing
    embedding/positional gradient accumulation loop from `Backward`.
- `STATIC FUNCTION CausalMask( seq_len )`
  - Returns `seq_len × seq_len` matrix: `0.0` where `j <= i` (allowed),
    `-1e9` where `j > i` (future, masked).
- Optimizers `Optimizer_Adam` / `Optimizer_SGD`: **unchanged** (identical
  parameter set; `W_vocab` is updated the same way).

Per-position cross-entropy helper:

- `FUNCTION CrossEntropyLossSeq( logits3D, targets2D )`
  - `targets2D` = `[batch][seq]` of target token ids (next-token, shifted).
  - Returns `{ avg_loss, d_logits3D }`; averages over all valid positions,
    `-1` / `0` target ids are skipped (padding).

### 2. Generation

- `METHOD Generate( aSeedIdx, nNew, nTemp, nTopK )`
  - `aSeedIdx` = 1D array of seed token ids. Defaults: `nNew := 20`,
    `nTemp := 1.0`, `nTopK := 0` (0 = full distribution / greedy when temp low).
  - Autoregressive loop, `nNew` steps:
    1. window = last `max_seq_len` ids of the running sequence.
    2. `logits := ForwardSeq( { window }, { posIdx } )` ; take **last position**
       row `logits[1][ Len(window) ]`.
    3. divide logits by `nTemp`, re-softmax, restrict to top-`nTopK` (if > 0),
       sample one id (`hb_RandomInt`-based weighted pick).
    4. append id; stop early on an optional end-of-text id.
  - Returns the full id array (seed + generated).

### 3. Save / Load

- `METHOD Save( cFile )`
  - Builds a hash:
    `{ "cfg" => {num_layers,d_model,n_heads,vocab_size,max_seq_len},`
    ` "aVocab", "Embedding", "Positional", "W_vocab",`
    ` "layers" => per-layer {WQ,WK,WV,Wo, ff{W1,W2,b1,b2}, n1{g,b}, n2{g,b}} }`
  - Writes `hb_Serialize( hModel )` to `cFile` (`hb_MemoWrit`).
- `METHOD Load( cFile )`
  - `hb_Deserialize( hb_MemoRead( cFile ) )`, rebuilds layer objects, restores
    all matrices + embedding hash. Returns `Self`. Validates config presence.

### 4. HuggingFace bridge — `source/classes/twordpiece.prg` (new)

- `CLASS TWordPiece`
  - `DATA hVocab` (token → id), `aVocab` (id → token), `cUnk INIT "[UNK]"`,
    `nMaxChars INIT 100`.
  - `METHOD Load( cVocabTxt )` — reads bert `vocab.txt` (one token per line,
    id = line number), builds `hVocab` + `aVocab`.
  - `METHOD Encode( cText )` — lowercase, split on whitespace + isolate
    punctuation, then greedy longest-match WordPiece per word
    (`##` continuation pieces); unknown word → `cUnk`. Returns id array.
  - `METHOD Decode( aIds )` — map ids → tokens, join, strip `##` joins.
- `FUNCTION HFReadVec( cFile, hEmb, nDim )`
  - Parses GloVe/fastText text format (`token f1 f2 ... fN` per line; skips an
    optional fastText `count dim` header line). Populates `hEmb`
    (token → `1×nDim` matrix) for warm-start. `nDim` must equal model `d_model`.

### 5. Sample — `samples/ai/transfgen.prg` (new)

Console + minimal status output:

1. Read `samples/ai/shakespeare.txt`.
2. Tokenize: whitespace word tokens by default; `#define USE_WORDPIECE` toggle
   to use `TWordPiece` with a `vocab.txt` if present.
3. Build training pairs: sliding window of `max_seq_len`, targets = input
   shifted by one (next-token).
4. Train AR LM with `ForwardSeq` / `CrossEntropyLossSeq` / `BackwardSeq` /
   `Optimizer_Adam`.
5. `Save( "transfgen.mdl" )`.
6. `Generate` 2–3 samples at temperatures (e.g. 0.7 and 1.0) and print.

Built with `build_new.bat` per CLAUDE.md.

## Out of scope (future)

- GELU / pre-LN activation options (only relevant to real-weight import).
- Direct GPT2 / BERT `.safetensors` weight loading.
- BPE tokenizer (gpt2). WordPiece chosen for simple pure-PRG impl.
- Python export scripts. Readers consume standard HF file formats the user
  downloads manually (`vocab.txt`, `.vec`).

## Testing

1. **Causal mask**: `CausalMask(n)` lower-triangular zeros, strict-upper `-1e9`.
   Logits at position `t` from `ForwardSeq` unchanged when tokens at
   positions `> t` are altered.
2. **Overfit**: train on one short line; loss decreases monotonically (roughly);
   greedy `Generate` from its seed reproduces the line.
3. **Save/Load**: `Save` then `Load` then `Generate` (fixed seed, greedy)
   gives identical token ids to pre-save model.
4. **WordPiece round-trip**: `Decode(Encode(text))` matches text for tokens
   present in vocab; OOV maps to `[UNK]`.
5. **HFReadVec**: known small `.vec` file loads correct vectors into the hash;
   warm-started model trains (loss decreases) without dimension errors.
6. **Regression**: existing `DemoTransformer()` and the classification path
   still run unchanged.

## Files touched

- `source/classes/transformer.prg` — add AR methods, `Generate`, `Save`,
  `Load`, `CausalMask`, `CrossEntropyLossSeq`. Existing methods unchanged.
- `source/classes/twordpiece.prg` — NEW tokenizer class + `HFReadVec`.
- `samples/ai/transfgen.prg` — NEW AR generation sample.
- `whatsnew.txt` — entry at top of current month section (per project convention).
