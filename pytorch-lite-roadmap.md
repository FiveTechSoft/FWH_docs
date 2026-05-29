# Roadmap: "PyTorch-lite in FWH"

Working notes for the effort to bring real transformer power into FiveWin/Harbour
apps by reusing HuggingFace resources. Living document — revisit and update as
phases land.

Related: `source/classes/transformer.prg`, `source/classes/hftokenizer.prg`,
`docs/{en,es,pt}/ai/hftokenizer.html`, samples in `samples/ai/`.

## Premise

Harbour-the-language is **not** inferior to Python for this. PyTorch is a thin
Python layer over a C++/CUDA core. FWH already ships C extensions
(`source/function/matrixes.c`). The gap to close is that **C core**, not the
language.

## Two tracks (keep distinct, set honest expectations)

- **Track A — local from-scratch Transformer.** Toy/educational scale, CPU,
  small `d_model`. Niche: tiny embeddable/offline models, classification on small
  data, teaching. Will not match PyTorch.
- **Track B — HuggingFace as remote power (Inference API).** Already partial:
  `tembeddings.prg`, `tollama.prg`, `chatgpt.prg`, `gemini*.prg`. Vastly more
  capable today, no local training.

This roadmap is about raising Track A's ceiling toward "run/serve real models
locally."

## GPT-2 weight-loading spike — findings (2026-05-29)

Sample: `samples/ai/gpt2spike.prg` (4/4 PASS).

Proved pure Harbour **can** read real GPT-2 `model.safetensors`:
- Parsed the safetensors header: **160 tensors, 137,022,720 params** (exact).
- Validated shapes: `wte[50257,768]`, `wpe[1024,768]`, `h.0.attn.c_attn.weight[768,2304]`.
- Decoded a real IEEE-754 float32 weight: `h.3.attn.c_proj.bias[0] = -0.0142482975`
  (matches a Python reference).
- Only fetched the **16 KB header** via an HTTP Range request — not the 500 MB file.

safetensors layout: `[u64 LE header_len][JSON header][raw tensor blob]`, where the
JSON maps `name -> { dtype, shape, data_offsets:[start,end] }` and offsets are
relative to the blob start.

**Blocker:** 137M params stored as Harbour nested arrays
(`array of array of double`, ~16–24 bytes/element) ≈ 2–3 GB RAM and slow. The
current matrix backend does not scale.

**Also needed — GPT-2-exact architecture** (our `Transformer` differs): pre-norm
(not post-norm), GELU (not ReLU), learned positional `wpe` (not sinusoidal),
combined QKV projection with bias, weight-tied `lm_head`.

## What FWH needs, by priority — and why

Each item removes a concrete bottleneck that today makes real models impossible
or impractical. The gap is the C core, not the language.

1. **Flat C-backed tensor type** (`FW_Tensor`: contiguous `malloc` float32 +
   shape/strides). The #1 item — unblocks everything.
   - **Why:** today a matrix is a Harbour *array of arrays of double*. Each element
     is a full Harbour item (~16–24 bytes) plus per-row array overhead. GPT-2's
     137M params would need **~2–3 GB** that way (and pointer-chasing kills cache
     locality). The same data as a flat `float32` buffer is **~523 MB**, contiguous,
     and can be `fread` straight from a safetensors file. Without this, loading any
     real pretrained model is a non-starter; with it, everything else becomes possible.
2. **BLAS/SIMD matmul** (OpenBLAS/MKL).
   - **Why:** `hb_MatrixMultiply` is a naive triple loop in C — correct but
     single-threaded and cache-naive. A GPT-2 forward pass is mostly large matmuls
     (e.g. 1024×768 · 768×2304, twelve times per layer). A tuned BLAS uses SIMD,
     blocking and all cores for **10–100×**. The difference is "seconds per token"
     vs "minutes per token" — the line between a usable demo and an unusable one.
3. **Autograd** (tape-based, reverse-mode automatic differentiation).
   - **Why:** this is PyTorch's actual killer feature. Today every `Backward()` in
     `transformer.prg` is hand-derived and hand-coded per layer — error-prone and a
     wall against trying new architectures. A tape that records ops on `FW_Tensor`
     and replays them in reverse means you write only the forward pass and get
     gradients for free. Required for *training* anything beyond our fixed model
     (not needed for inference — see phases).
4. **float32 / bf16 / fp16 compute.**
   - **Why:** we compute in 64-bit double. Half/single precision **halves (or
     quarters) memory and bandwidth** and is what real models ship in. Memory
     bandwidth, not flops, is the usual bottleneck on CPU; smaller dtypes ≈ faster.
5. **GPU backend** (cuBLAS/OpenCL).
   - **Why:** CPUs top out around a few hundred GFLOP/s; a GPU is 10–100 TFLOP/s.
     For models past ~100M params, or any training at scale, this is where the real
     power lives. Optional because inference of small/medium models is fine on CPU+BLAS.
6. **Kernel zoo**: optimized attention (flash), normalizations, optimizers, conv.
   - **Why:** naive attention materializes the full seq×seq scores matrix (O(n²)
     memory); fused/flash kernels avoid that and are far faster. A broad, correct
     kernel set is what lets you build many models instead of one.
7. **Model IO**: safetensors (proven), GGUF, ONNX.
   - **Why:** this is how you *reuse the world's pretrained weights* instead of
     training from scratch. safetensors reading is already proven (the spike);
     GGUF opens the llama.cpp/quantized ecosystem; ONNX opens cross-framework models.
8. **Ecosystem**: tokenizers (done — `HFTokenizer`), datasets, Hub access.
   - **Why:** a model is useless without the exact tokenizer it was trained with
     (bit-exact ids), data to train on, and a way to fetch weights. `HFTokenizer`
     already closes the tokenizer half; datasets + Hub download close the rest.

## Pragmatic phases

| Phase | Deliverable | Notes |
|-------|-------------|-------|
| 1 | `FW_Tensor` flat C type + ops rewritten on it | Removes the memory blocker |
| 2 | BLAS backend for matmul | 10–100× speedup |
| 3 | `GPT2Model` **inference-only** (no autograd) loading safetensors | THE killer demo: real pretrained GPT-2 text generation in FWH/CPU. ~1–5 tok/s with BLAS. Needs only Phase 1+3. |
| 4 (opt) | Tape autograd for training; GPU backend | Toward training real models |

**Key insight:** GPT-2 *inference* needs no autograd — only Phase 1 + Phase 3.
That is the most direct path to a headline feature.

**Why this order:**
- Phase 1 first because it is a **hard dependency** of everything else: you cannot
  hold, load, or efficiently compute on real weights while data lives in Harbour
  nested arrays. It also pays off immediately (loading safetensors).
- Phase 2 before Phase 3 because a correct-but-slow GPT-2 forward (naive matmul)
  may be too slow to demo; BLAS turns it usable. (Phase 3 can start on naive matmul
  and simply get faster once Phase 2 lands.)
- Phase 3 before Phase 4 because **inference delivers the headline result with the
  least machinery** (no autograd, no GPU): real pretrained GPT-2 generating text
  inside an FWH app. Training (Phase 4) is strictly more work and can follow.
- Each phase is independently shippable and leaves the library in a working state,
  so the effort can pause/resume without half-finished plumbing.

## Status

- [x] HFTokenizer (GPT-2 BPE), bit-exact — in lib
- [x] Tokenizer → Transformer bridge (compact vocab)
- [x] `TFWLanguageModel` wrapper (sample; port to lib pending)
- [x] GPT-2 safetensors read + float32 decode spike (`samples/ai/gpt2spike.prg`)
- [x] (Track A demo) train on real Shakespeare text (`samples/ai/shakegpt.prg`): overfit a line exactly + loss drops on a real slice. Added `HB_MatrixSeed()` for reproducible init.
- [x] Phase 1: `FW_Tensor` (`source/function/fwtensor.c`): flat float32 GC tensor with create/get/set/shape, FromArray/ToArray, MatMul, safetensors float32 loader, **plus the forward-pass op set**: Add, Scale, AddBias, GELU, row-wise Softmax, row-wise LayerNorm, Transpose. All tested in `samples/ai/fwtensortest.prg` (9/9). Remaining nice-to-haves for Phase 3: row-gather (embedding/positional lookup), causal-mask add, head slicing/views — these compose from the above.
- [ ] Phase 2: BLAS
- [ ] Phase 3: `GPT2Model` inference (load real GPT-2 weights via FWT_LoadSafe + header parse, pre-norm/GELU/learned-pos/QKV-bias/weight-tying)
- [ ] Phase 4: autograd / GPU
- [ ] (Track A) top-p / nucleus + repetition-penalty sampling (the greedy degeneration seen in shakegpt)
