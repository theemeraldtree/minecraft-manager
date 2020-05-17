/* eslint no-param-reassign: 0 */

// Microsoft Fluent Design-inspired hover effect
const FluentHover = {
  /**
   * Called when the onMouseMove event is triggered
   * @param {obj} e - The event
   * @param {obj} ref - The React ref to the component
   * @param {string} baseColor - The base color of the component
   * @param {boolean} dim - If true, the hover effect is dimmer
   * @param {boolean} wide - If true, the hover effect is wider
   */
  mouseMove: (e, ref, baseColor, dim, wide) => {
    if (ref.current && ref.current.style) {
      const bcr = ref.current.getBoundingClientRect();
      const x = e.pageX - bcr.left;
      const y = e.pageY - bcr.top;

      ref.current.style.background = `radial-gradient(${wide ? '500px' : '100px'} at ${x}px ${y}px, rgba(255, 255, 255, ${dim ? '0.1' : '0.3'}) 0%, ${baseColor} 100%) repeat scroll 0% 0%, ${baseColor} none repeat scroll 0% 0%`;
    }
  },

  mouseLeave: (ref, baseColor) => {
    if (ref.current && ref.current.style) {
      ref.current.style.background = baseColor;
    }
  }
};

export default FluentHover;
