// The fixed background behind every page: glow gradients, a fading line grid, two drifting orbs and grain.
// Styles live in globals.css (.pa-bg, .pa-orb, .pa-grain). Page content must sit in a `.pa-page` wrapper (z-index 1).
export default function PaBackground() {
  return (
    <div className="pa-bg" aria-hidden="true">
      <div className="pa-orb pa-orb-1" />
      <div className="pa-orb pa-orb-2" />
      <div className="pa-grain" />
    </div>
  );
}
