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

## Three tracks (keep distinct, set honest expectations)

- **Track A — local from-scratch Transformer.** Toy/educational scale, CPU,
  small `d_model`. Niche: tiny embeddable/offline models, classification on small
  data, teaching. Will not match PyTorch.
- **Track B — HuggingFace as remote power (Inference API).** Already partial:
  `tembeddings.prg`, `tollama.prg`, `chatgpt.prg`, `gemini*.prg`. Vastly more
  capable today, no local training.
- **Track C — bind llama.cpp (`libllama`) via FFI.** Highest real value for "run
  a real LLM *locally* inside an FWH app *today*". llama.cpp already does the hard
  part: quantized weights, SIMD, GPU, KV cache, mmap, GGUF. A `TLlamaCpp` class
  would just call its C API (`llama_load_model_from_file`, `llama_decode`,
  sampling) — the same pattern as the hbcurl binding — giving real
  Llama/Mistral/Qwen/Phi inference on CPU/GPU with 4-bit quantization, no training.

This roadmap (Phases below) raises **Track A**'s ceiling toward "run/serve real
models locally". Track C is a separate, complementary effort (an FFI binding, not
a from-scratch core) and is the pragmatic path if the goal is production LLM power
in FWH apps now.

### Why NOT make our Transformer weight-compatible with llama.cpp models

Low value, high cost. LLaMA/Mistral use **RoPE** (not learned positions),
**RMSNorm** (not LayerNorm), **SwiGLU** (not GELU/ReLU) and **GQA** (grouped-query
attention) — different from GPT-2 and from our class. Running their weights would
mean a per-architecture rewrite plus GGUF block dequantization. Binding `libllama`
(Track C) gets the same capability for a fraction of the effort.

## Lessons from llama.cpp (fold into Track A so `FW_Tensor` scales)

| Lesson | What it is | Where it applies here |
|--------|-----------|-----------------------|
| **Quantization** (Q4_K/Q8_0) | weights in 4–8-bit blocks + per-block scale | 4-bit = 1/8 the memory of float32; how 7B fits in 4 GB. `FW_Tensor` should support quantized blocks + dequant-in-matmul |
| **mmap weights** | memory-map the file; OS pages on demand | `FWT_LoadSafe` currently `fread`s; mmap = "load" 500 MB instantly, lazy paging |
| **KV cache** | cache K,V per layer across generation steps | our `Generate` recomputes the whole window each token (O(n²)); KV cache → O(1) layers/token |
| **ggml graph + backends** | op graph + pluggable CPU/CUDA/Metal backend + arena allocator | architecture target for `FW_Tensor`: build a graph, one allocator, swap backends (aligns with Phase 2/4) |
| **SIMD + threaded + blocked matmul** | cache-aware multicore kernels | our matmul is a triple loop → Phase 2 (BLAS) |
| **GGUF single-file format** | metadata KV + tensors + quant in one mmap'd file | a GGUF reader (like our safetensors reader) opens the quantized-model ecosystem (Model IO) |
| **Single static binary, no deps** | one self-contained exe | matches the FWH ethos (`-static`) |

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

## Concrete HuggingFace utilities for FWH apps (the "FWAI" objective)

**Objective:** make FWH a first-class AI app platform — any HuggingFace-hosted
capability usable from Harbour in a few lines, via three *interchangeable*
backends: remote (Inference API, breadth today), local (FW_Tensor / llama.cpp,
privacy + offline) and from-scratch (educational). FiveWin apps are DBF/SQL +
xBrowse business apps, so the high-value utilities are the ones that plug AI into
that data.

| Utility | What it does in an FWH app | Backend | Have / Need | Value |
|---------|----------------------------|---------|-------------|-------|
| **Semantic search** over DBF/SQL | find customers/invoices/products by *meaning*, not LIKE | embeddings (API `tembeddings` ✓ / local) + cosine | base ✓, need `TSemanticIndex` | ★★★ |
| **RAG / doc Q&A** | answer natural-language questions over company PDFs/manuals | embeddings + retrieval + LLM | pieces ✓, need pipeline | ★★★ |
| **Text classification** | auto-categorize tickets, emails, expenses; intent routing | API / small local transformer ✓ | `THFTask:Classify` | ★★★ |
| **NER (extraction)** | pull names/dates/amounts/tax-ids from free text → DB fields | API / local | `THFTask:NER` | ★★★ |
| **Speech-to-text (Whisper)** | dictation into GETs, transcribe calls/voice notes | API / whisper.cpp binding | need | ★★★ |
| **Summarization** | long notes/reports/emails → summary field | API / llama.cpp | `THFTask:Summarize` | ★★ |
| **Translation** | multilingual invoices / UI / content | API | `THFTask:Translate` | ★★ |
| **Sentiment** | score reviews / customer feedback | API / local | `THFTask:Sentiment` | ★★ |
| **OCR / image→text** | scan receipts/IDs → text → DB | API / local VLM | need | ★★ |
| **In-app chat assistant** | query the app's data in natural language; help | llama.cpp local / API | `TChatAgent` | ★★★ |
| **GET autocomplete** | next-word / field prediction | local GPT-2 (✓ now feasible) | sample | ★★ |
| **Data normalization** | fix addresses, dedupe, standardize | LLM API/local | need | ★★ |

**First five to build (max value / least effort):**
1. **`TSemanticIndex`** ✅ DONE — index a DBF/SQL column into embeddings;
   `:Search(cText)` returns records by cosine similarity. The killer feature for
   data apps; reuses `tembeddings`. In lib (`source/classes/tsemanticindex.prg`);
   test `samples/ai/semindextest.prg`; docs `docs/{en,es,pt}/ai/tsemanticindex.html`.
2. **`TChatAgent`** ✅ DONE — chat over the app's data (function-calling: the LLM
   asks for queries, the app returns rows). Backend-agnostic (`bChat`/`bTool`
   codeblocks). In lib (`source/classes/tchatagent.prg`); test
   `samples/ai/chatagenttest.prg`; docs `ai/thftask.html`.
3. **`THFTask`** ✅ DONE — `:Classify / :ZeroShot / :NER / :Summarize / :Translate /
   :Sentiment` over the HF Inference API; injectable transport for offline tests.
   In lib (`source/classes/thftask.prg`); test `samples/ai/thftasktest.prg`; docs
   `ai/thftask.html`. Covers five utilities at once.
4. **`TWhisperCpp`** ✅ DONE — binding to whisper.cpp for offline dictation → text.
   In lib (`source/classes/twhispercpp.prg`); native binding
   `source/winapi/whispercpp.c` is an **optional module** (not in fwhc.hbp), so
   normal apps link nothing — `IsAvailable()` is `.F.` until an app builds it with
   `-DHB_HAS_WHISPER` + libwhisper. Test `samples/ai/whispertest.prg`, demo
   `samples/ai/whisperdemo.prg`.
5. **GET autocomplete with local GPT-2** — everything needed already exists.

**Demos shipped** (`samples/ai/`): `gpt2demo.prg`, `semdemo.prg`, `hftaskdemo.prg`,
`chatdemo.prg`, `whisperdemo.prg`.

**Key pattern:** every utility ships with interchangeable backends (remote for
breadth now, local FW_Tensor/llama.cpp for privacy/offline). That is the FWAI
objective in practice.

## Local vs cloud API (e.g. TDeepSeek) — when to use each

This is not either/or. A cloud API (TDeepSeek, OpenAI, Gemini…) wins on raw
capability; local wins on the deployment context. Pick the backend per task.

**Where local (FW_Tensor / GPT-2 / llama.cpp) wins:**
- **Privacy / data sovereignty** — data never leaves the machine (GDPR, medical,
  legal, financial, defense). A cloud API ships your data to a third party.
- **Offline** — factories, ships, isolated/air-gapped networks. No internet needed.
- **Zero per-call cost** — embeddings over 1M DBF rows, autocomplete on every
  keystroke: free locally; metered + rate-limited via API.
- **Latency** — local classify/embed is instant; per-keystroke (<50 ms) is
  impossible across a network round-trip.
- **No dependency / longevity** — APIs change, deprecate, raise prices, go down,
  geo-block. A local model is yours forever and ships inside the .exe.
- **Determinism / auditability** — fixed weights = reproducible output; cloud
  models change under you. Regulated industries need this.
- **Embeddable / no account** — AI in a desktop app with zero setup, no per-customer
  API key, no signup.
- **Customization** — train tiny domain models on the customer's own data (Track A).

**Where the cloud API wins (be honest):**
- **Raw capability** — DeepSeek-V3/R1 ≫ GPT-2 or anything you run locally on CPU.
  Hard reasoning / high-quality chat → cloud wins decisively.
- **Zero infrastructure** — no 500 MB model, no RAM/GPU footprint.
- **Always the latest model, maintenance-free.**

**Rule of thumb:** cloud for heavy reasoning / quality chat on non-sensitive,
online data; local for sensitive data, offline, high-volume/cheap (semantic search
over a whole DB), per-keystroke latency, embedded zero-setup, regulated/auditable.

**The key insight — hybrid.** Local *complements* the cloud, it does not replace
it. Example RAG: do retrieval with **local embeddings** (cheap, private, over
hundreds of thousands of records), then generate the answer with **the cloud API**
(quality). The interchangeable-backend design means the developer chooses per task
and the app is never locked to one provider.

## Status

- [x] HFTokenizer (GPT-2 BPE), bit-exact — in lib
- [x] Tokenizer → Transformer bridge (compact vocab)
- [x] `TFWLanguageModel` wrapper (sample; port to lib pending)
- [x] GPT-2 safetensors read + float32 decode spike (`samples/ai/gpt2spike.prg`)
- [x] (Track A demo) train on real Shakespeare text (`samples/ai/shakegpt.prg`): overfit a line exactly + loss drops on a real slice. Added `HB_MatrixSeed()` for reproducible init.
- [x] Phase 1: `FW_Tensor` (`source/function/fwtensor.c`): flat float32 GC tensor with create/get/set/shape, FromArray/ToArray, MatMul, safetensors float32 loader, **plus the forward-pass op set**: Add, Scale, AddBias, GELU, row-wise Softmax, row-wise LayerNorm, Transpose. All tested in `samples/ai/fwtensortest.prg` (9/9). Remaining nice-to-haves for Phase 3: row-gather (embedding/positional lookup), causal-mask add, head slicing/views — these compose from the above.
- [ ] Phase 2: BLAS
- [x] Phase 3: `GPT2Model` inference — **WORKS and is numerically verified**. Real pretrained GPT-2 small (124M params, model.safetensors) loads via FWT_LoadSafe (per-tensor fread, no full-file load) and runs the full forward in pure FWH/Harbour on CPU. `samples/ai/gpt2test.prg`: "The capital of France is" -> " the" (id 262), matching a numpy GPT-2 reference exactly. Next: a generation loop (multi-token), then port `GPT2Model` to the library. (Phase 2 BLAS would speed it up.)
- [ ] Phase 4: autograd / GPU
- [ ] (Track A) top-p / nucleus + repetition-penalty sampling (the greedy degeneration seen in shakegpt)
