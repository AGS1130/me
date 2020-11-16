const htmlmin = require('html-minifier');
const { PurgeCSS } = require('purgecss');
const CleanCSS = require('clean-css');
const { minify } = require('terser');

module.exports = function (eleventyConfig) {
  eleventyConfig.setTemplateFormats([
    // Templates:
    'html',
    'hbs',
    // Static Assets:
    'js',
    'css',
    'jpeg',
    'jpg',
    'png',
    'svg',
  ]);

  eleventyConfig.addPassthroughCopy('static');

  /* Shortcodes */
  eleventyConfig.addShortcode('socialLinks', function () {
    let res = ``;
    const socialLinks = [
      {
        href: 'https://www.linkedin.com/in/ags1130/',
        icon: 'fab fab fa-linkedin',
      },
      {
        href: 'https://ags1130.dev/',
        icon: 'icon-ags1130',
      },
      {
        href: 'https://github.com/AGS1130/',
        icon: 'fab fab fa-github',
      },
    ];

    socialLinks.forEach(({ href, icon }) => {
      res += `
      <a target="_blank" href="${href}">
        <span class="${icon}"></span>
      </a>
      `;
    });

    return res;
  });

  eleventyConfig.addShortcode('innerCard', function (id) {
    const content = require(`./_includes/${id}.hbs`)();
    const initialState =
      id === 'home' ? 'active fadeInLeft' : 'hidden fadeOutLeft';

    const res = `
    <div id="${id}" class="card-inner animated ${initialState}">
      <div class="card-wrap">
      ${content
        .split('<!-- content -->')
        .map((html) => {
          return `
        <section class="section">
          <div class="container">
            ${html}
          </div>
        </section>
        `;
        })
        .join('')}
      </div>
    </div>
    `;

    return res;
  });

  /* Transformers */
  eleventyConfig.addTransform('htmlmin', function (content, outputPath) {
    if (outputPath.endsWith('.html')) {
      let minified = htmlmin.minify(content, {
        useShortDoctype: true,
        removeComments: true,
        collapseWhitespace: true,
      });
      return minified;
    }

    return content;
  });

  eleventyConfig.addTransform('purge-and-inline-css', async function (
    content,
    outputPath,
  ) {
    const isDevelopment =
      process.env.ELEVENTY_ENV !== 'production' ||
      !outputPath.endsWith('.html');

    if (isDevelopment) {
      return content.replace(
        '<link rel="stylesheet">',
        `<link rel="stylesheet" href="/static/css/style.css" />`,
      );
    }

    const purgeCSSResults = await new PurgeCSS().purge({
      content: [{ raw: content }],
      css: ['_template/static/css/style.css'],
    });

    const res = await new CleanCSS({}).minify(purgeCSSResults[0].css).styles;
    return content.replace('<link rel="stylesheet">', `<style>${res}</style>`);
  });

  eleventyConfig.addTransform('jsmin', async function (content, outputPath) {
    const isDevelopment =
      process.env.ELEVENTY_ENV !== 'production' ||
      !outputPath.endsWith('.html');

    if (isDevelopment) {
      return content.replace(
        '<script src=""></script>',
        `<script src="/static/js/index.js"></script>`,
      );
    }

    try {
      const minified = await minify(`if (typeof window !== 'undefined') {
        window.onload = function () {
          setTimeout(function () {
            document.querySelector('.preloader').style.display = 'none';
          }, 1500);
        };
      }`);
      return content.replace(
        '<script src=""></script>',
        `<script>${minified.code}</script>`,
      );
    } catch (err) {
      console.error('Terser error: ', err);
      // Fail gracefully.
      return content.replace(
        '<script src=""></script>',
        `<script src="/static/js/index.js"></script>`,
      );
    }
  });

  return {
    dir: {
      input: '_template',
      includes: '../_includes',
      output: '_output',
    },
  };
};
