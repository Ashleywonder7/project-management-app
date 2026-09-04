const removePasswordRevealRules = () => ({
  postcssPlugin: 'remove-password-reveal-rules',
  OnceExit(root) {
    root.walkRules((rule) => {
      if (
        rule.selector.includes('::-ms-reveal') ||
        rule.selector.includes('::-webkit-credentials-auto-fill-button') ||
        rule.selector.includes('::-webkit-reveal')
      ) {
        rule.remove();
      }
    });
  },
});

removePasswordRevealRules.postcss = true;

module.exports = {
  plugins: [
    require('@tailwindcss/postcss')(),
    require('autoprefixer')(),
    removePasswordRevealRules(),
  ],
};
