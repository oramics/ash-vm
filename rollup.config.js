import babel from "rollup-plugin-babel"
import resolve from "rollup-plugin-node-resolve"
import uglify from "rollup-plugin-uglify"
import filesize from "rollup-plugin-filesize"

export default {
  plugins: [
    babel({
      babelrc: false,
      presets: ["es2015-rollup"]
      // plugins: ["transform-flow-strip-types"]
    }),
    resolve({
      jsnext: true
    }),
    uglify(),
    filesize(),
  ]
}
