import typescript from 'rollup-plugin-typescript2'
import commonjs from '@rollup/plugin-commonjs'
import resolve from '@rollup/plugin-node-resolve'
import babel from '@rollup/plugin-babel'
import pkg from './package.json'
import json from '@rollup/plugin-json'
import addDts from 'rollup-plugin-add-global-ts'

const babelOpt = {
  extensions: ['.js', '.ts'],
  babelHelpers: 'runtime',
  exclude: 'node_modules/**',
  include: ['src/**/*'],
  plugins: ['@babel/plugin-transform-runtime'],
  presets: [
    [
      '@babel/preset-env',
      {
        targets: {
          node: '10',
        },
      },
    ],
  ],
}

export default [
  {
    input: 'src/index.ts',
    external: Object.keys(pkg.dependencies || {}),
    output: [{ file: pkg.main, format: 'cjs' }],
    plugins: [
      json(),
      typescript(),
      resolve(),
      commonjs(),
      babel(babelOpt),
      addDts(['src/typings.d.ts']),
    ],
  },
]
