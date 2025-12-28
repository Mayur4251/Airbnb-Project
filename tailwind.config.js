// tailwind.config.js
module.exports = {
  content: [
    "./views/**/*.ejs",   // if you are using EJS templates
    "./views/**/*.html",  // if you are using HTML files
    "./public/**/*.js",   // if you have JS files
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
