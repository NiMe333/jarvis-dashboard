// Shared helpers and layer composition contract.
vec3 layerAdd(vec3 color, vec3 layer, float intensity) { return color + layer * intensity; }
float aspectCircle(vec2 p, vec2 resolution) { return length(p * vec2(resolution.x / resolution.y, 1.0)); }
