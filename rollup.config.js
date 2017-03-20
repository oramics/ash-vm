import babel from 'rollup-plugin-babel'
import resolve from 'rollup-plugin-node-resolve'
import uglify from 'rollup-plugin-uglify'

export default {
  plugins: [
    babel({
      babelrc: false,
      presets: ['es2015-rollup']
    }),
    resolve({
      jsnext: true
    }),
    uglify()
  ]
}
