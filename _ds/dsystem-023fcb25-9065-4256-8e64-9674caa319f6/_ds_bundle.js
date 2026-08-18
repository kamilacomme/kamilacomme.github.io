/* @ds-bundle: {"format":4,"namespace":"KamilaCommeDesignSystem_023fcb","components":[{"name":"Badge","sourcePath":"components/core/Badge.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Card","sourcePath":"components/core/Card.jsx"},{"name":"CornerMark","sourcePath":"components/core/CornerMark.jsx"},{"name":"Divider","sourcePath":"components/core/Divider.jsx"},{"name":"Link","sourcePath":"components/core/Link.jsx"},{"name":"SectionLabel","sourcePath":"components/core/SectionLabel.jsx"},{"name":"Tag","sourcePath":"components/core/Tag.jsx"}],"sourceHashes":{"components/core/Badge.jsx":"fca93cc504a4","components/core/Button.jsx":"518c9b83e536","components/core/Card.jsx":"4f0cbfa5109e","components/core/CornerMark.jsx":"5c71a02e1c14","components/core/Divider.jsx":"9cea3f191765","components/core/Link.jsx":"16db5955f31c","components/core/SectionLabel.jsx":"df75af3926f7","components/core/Tag.jsx":"fcc6befdc47b"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.KamilaCommeDesignSystem_023fcb = window.KamilaCommeDesignSystem_023fcb || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/core/Badge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Kamila Comme — Badge.
 * Compact proof-point strip for the Hero (e.g. "Featured on Behance × 2 ·
 * 450k views"). Optional lemon-700 status dot — the single sanctioned accent.
 */
function Badge({
  dot = false,
  children,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      fontFamily: "var(--font-body, 'Inter', sans-serif)",
      fontWeight: 'var(--fw-label, 500)',
      fontSize: '0.75rem',
      letterSpacing: '0.04em',
      textTransform: 'uppercase',
      color: 'var(--text-muted, #5C575C)',
      border: '1px solid var(--border-subtle, #E6E0E6)',
      borderRadius: 'var(--radius, 4px)',
      padding: '6px 12px',
      ...style
    }
  }, rest), dot && /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      width: '8px',
      height: '8px',
      borderRadius: '50%',
      background: 'var(--accent-dot, #687E15)',
      flex: '0 0 auto'
    }
  }), children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Badge.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Kamila Comme — Button.
 * Primary = saturated light fill (pink-500) with dark text; NOT a dark heavy fill.
 * Secondary/ghost = transparent, neutral-800 border, dark text.
 * Single 4px radius. No color shift on the label — weight + fill do the work.
 */
function Button({
  variant = 'primary',
  size = 'md',
  disabled = false,
  as = 'button',
  children,
  style,
  ...rest
}) {
  const sizes = {
    sm: {
      padding: '6px 14px',
      fontSize: '0.75rem'
    },
    md: {
      padding: '10px 20px',
      fontSize: '0.875rem'
    },
    lg: {
      padding: '14px 28px',
      fontSize: '1rem'
    }
  };
  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontFamily: "var(--font-body, 'Inter', sans-serif)",
    fontWeight: 'var(--fw-emphasis, 600)',
    letterSpacing: '-0.01em',
    lineHeight: 1,
    borderRadius: 'var(--radius, 4px)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    border: '1px solid transparent',
    transition: 'background-color .18s ease, border-color .18s ease, opacity .18s ease',
    whiteSpace: 'nowrap',
    textDecoration: 'none',
    opacity: disabled ? 0.4 : 1,
    ...sizes[size]
  };
  const variants = {
    primary: {
      background: 'var(--primary, #FDB4F5)',
      color: 'var(--text-on-primary, #222022)'
    },
    secondary: {
      background: 'transparent',
      color: 'var(--text-default, #222022)',
      borderColor: 'var(--border-functional, #5C575C)'
    },
    ghost: {
      background: 'transparent',
      color: 'var(--text-default, #222022)'
    },
    dark: {
      background: 'var(--surface-dark, #330F2F)',
      color: 'var(--text-on-dark, #fff)'
    }
  };
  const Tag = as;
  return /*#__PURE__*/React.createElement(Tag, _extends({
    disabled: as === 'button' ? disabled : undefined,
    style: {
      ...base,
      ...variants[variant],
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/Card.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Kamila Comme — Card ("canvas in frame" / passe-partout).
 * A light content card. When `framed`, it sits on the dark/atmospheric surface
 * with an equal field on all four sides — the brand's most-used composition.
 */
function Card({
  framed = false,
  children,
  style,
  ...rest
}) {
  const card = {
    background: 'var(--surface-card, #fff)',
    borderRadius: 'var(--radius, 4px)',
    padding: 'var(--space-4, 32px)',
    border: framed ? 'none' : '1px solid var(--border-subtle, #E6E0E6)',
    color: 'var(--text-default, #222022)'
  };
  if (!framed) {
    return /*#__PURE__*/React.createElement("div", _extends({
      style: {
        ...card,
        ...style
      }
    }, rest), children);
  }

  // passe-partout: equal padding all sides on the dark surface
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      background: 'var(--surface-dark, #330F2F)',
      padding: 'var(--space-4, 32px)',
      borderRadius: 'var(--radius, 4px)',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: card
  }, children));
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Card.jsx", error: String((e && e.message) || e) }); }

// components/core/CornerMark.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Kamila Comme — CornerMark.
 * The catalog/archive micro-label that sits in a frame corner: coordinates,
 * issue/volume numbers, "scroll", a year. A signature editorial motif.
 */
function CornerMark({
  corner = 'top-left',
  children,
  style,
  ...rest
}) {
  const pos = {
    'top-left': {
      top: 'var(--space-3, 24px)',
      left: 'var(--space-3, 24px)'
    },
    'top-right': {
      top: 'var(--space-3, 24px)',
      right: 'var(--space-3, 24px)'
    },
    'bottom-left': {
      bottom: 'var(--space-3, 24px)',
      left: 'var(--space-3, 24px)'
    },
    'bottom-right': {
      bottom: 'var(--space-3, 24px)',
      right: 'var(--space-3, 24px)'
    }
  };
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      position: 'absolute',
      ...pos[corner],
      fontFamily: "var(--font-body, 'Inter', sans-serif)",
      fontWeight: 'var(--fw-label, 500)',
      fontSize: 'var(--label-size, 0.75rem)',
      letterSpacing: 'var(--label-track, 0.04em)',
      textTransform: 'uppercase',
      color: 'var(--text-muted, #5C575C)',
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { CornerMark });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/CornerMark.jsx", error: String((e && e.message) || e) }); }

// components/core/Divider.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Kamila Comme — Divider.
 * Decorative rule in neutral-300 (default) or neutral-400. Horizontal or
 * vertical. Not a normalised token — purely a rhythm/structure element.
 */
function Divider({
  orientation = 'horizontal',
  tone = '300',
  style,
  ...rest
}) {
  const color = tone === '400' ? 'var(--neutral-400, #E6E0E6)' : 'var(--divider, #F2EEF2)';
  const isV = orientation === 'vertical';
  return /*#__PURE__*/React.createElement("div", _extends({
    role: "separator",
    "aria-orientation": orientation,
    style: {
      background: color,
      width: isV ? '1px' : '100%',
      height: isV ? '100%' : '1px',
      flex: '0 0 auto',
      ...style
    }
  }, rest));
}
Object.assign(__ds_scope, { Divider });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Divider.jsx", error: String((e && e.message) || e) }); }

// components/core/Link.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Kamila Comme — Link.
 * Interactive text. Colour NEVER changes (stays neutral-900); the only signal
 * is weight (SemiBold). No underline. Optional trailing arrow for jump-links.
 */
function Link({
  arrow,
  children,
  style,
  ...rest
}) {
  const arrowGlyph = arrow === 'down' ? '↓' : arrow === 'out' ? '↗' : arrow === 'right' ? '→' : null;
  return /*#__PURE__*/React.createElement("a", _extends({
    style: {
      color: 'var(--link, #222022)',
      fontFamily: "var(--font-body, 'Inter', sans-serif)",
      fontWeight: 'var(--fw-emphasis, 600)',
      letterSpacing: '-0.01em',
      textDecoration: 'none',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      cursor: 'pointer',
      ...style
    }
  }, rest), children, arrowGlyph && /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true"
  }, arrowGlyph));
}
Object.assign(__ds_scope, { Link });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Link.jsx", error: String((e && e.message) || e) }); }

// components/core/SectionLabel.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Kamila Comme — SectionLabel.
 * The uppercase kicker that titles a section. Supports the signature
 * "bracket as frame" treatment: ( WORKS ). Optional index number carries
 * heading weight, per the catalog/archive motif.
 */
function SectionLabel({
  children,
  bracket = false,
  index,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: 'inline-flex',
      alignItems: 'baseline',
      gap: '10px',
      fontFamily: "var(--font-body, 'Inter', sans-serif)",
      fontWeight: 'var(--fw-label, 500)',
      fontSize: 'var(--label-size, 0.75rem)',
      lineHeight: 'var(--label-line, 1.67)',
      letterSpacing: 'var(--label-track, 0.04em)',
      textTransform: 'uppercase',
      color: 'var(--text-muted, #5C575C)',
      ...style
    }
  }, rest), index != null && /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-default, #222022)',
      fontWeight: 600
    }
  }, index), /*#__PURE__*/React.createElement("span", null, bracket ? `( ${childrenToText(children)} )` : children));
}
function childrenToText(children) {
  return typeof children === 'string' ? children : children;
}
Object.assign(__ds_scope, { SectionLabel });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/SectionLabel.jsx", error: String((e && e.message) || e) }); }

// components/core/Tag.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Kamila Comme — Tag / pill.
 * Fill = tone-300 of the chosen ramp, text = neutral-900 (black, never coloured),
 * no border, single 4px radius (full-round pills were dropped for form discipline).
 */
function Tag({
  tone = 'pink',
  children,
  style,
  ...rest
}) {
  const fills = {
    pink: 'var(--pink-300, #FFDCFB)',
    blue: 'var(--blue-300, #B0E5FD)',
    lemon: 'var(--lemon-300, #F1FBD0)',
    neutral: 'var(--neutral-300, #F2EEF2)'
  };
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      background: fills[tone],
      color: 'var(--text-default, #222022)',
      fontFamily: "var(--font-body, 'Inter', sans-serif)",
      fontWeight: 'var(--fw-label, 500)',
      fontSize: '0.75rem',
      lineHeight: 1.4,
      letterSpacing: '0.01em',
      padding: '4px 10px',
      borderRadius: 'var(--radius, 4px)',
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { Tag });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Tag.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.CornerMark = __ds_scope.CornerMark;

__ds_ns.Divider = __ds_scope.Divider;

__ds_ns.Link = __ds_scope.Link;

__ds_ns.SectionLabel = __ds_scope.SectionLabel;

__ds_ns.Tag = __ds_scope.Tag;

})();
