# Glass lens provenance

Rendered from the supplied `frontier-summit-v05-loading.blend`, without changing
the source scene. Original Blender lens geometry/materials and reflector lighting;
transparent film; no event text, logo, background or compositor.

1024×1024, 192 samples, denoising, RGBA. Original framing and 67-degree orientation.
- `glass-lens.png`: source render, Lens_Orbit_02, 830,958 bytes.
- `glass-lens.webp`: lossless runtime copy, 508,508 bytes.
- `glass-lens-light.webp`: Lens_Orbit_04 under brighter lighting, 493,186 bytes.

Lossless WebP decoding verified identical in RGBA. The renderer uploads premultiplied
alpha textures and generates mipmaps to avoid contaminated/unstable edge colors.
Its shape morph uses these textures, not live ray-traced glass refraction.
