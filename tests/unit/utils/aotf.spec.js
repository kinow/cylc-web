/**
 * Copyright (C) NIWA & British Crown (Met Office) & Contributors.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import dedent from 'dedent'
import { expect } from 'chai'
// need the polyfill as otherwise ApolloClient fails to be imported as it checks for a global fetch object on import...
import 'cross-fetch/polyfill'
import * as aotf from '@/utils/aotf'

describe('utils', () => {
  describe('aotf', () => {
    describe('iterateType', () => {
      it('Should walk the type tree until it hits a solid foundation', () => {
        const nodes = [
          {
            name: null,
            kind: 'NON_NULL'
          },
          {
            name: null,
            kind: 'LIST'
          },
          {
            name: null,
            kind: 'NON_NULL'
          },
          {
            name: 'MyInputObject',
            kind: 'INPUT_OBJECT'
          }
        ]

        // chain these nodes together using the ofType field
        let prev = nodes[0]
        nodes.slice(1).forEach((node) => {
          prev.ofType = node
          prev = node
        })

        const result = []
        for (const node of aotf.iterateType(nodes[0])) {
          result.push(node)
        }

        expect(
          result
        ).to.deep.equal(
          nodes
        )
      })
    })

    describe('argumentSignature', () => {
      it('should correctly render the signature', () => {
        [
          // [type, signature]
          [
            {
              kind: 'TEST_TYPE'
            },
            'TEST_TYPE'
          ],
          [
            {
              name: 'String',
              kind: 'SCALAR',
              ofType: null
            },
            'String'
          ],
          [
            {
              name: null,
              kind: 'NON_NULL',
              ofType: {
                name: 'String',
                kind: 'SCALAR',
                ofType: null
              }
            },
            'String!'
          ],
          [
            {
              name: null,
              kind: 'NON_NULL',
              ofType: {
                name: null,
                kind: 'LIST',
                ofType: {
                  name: null,
                  kind: 'NON_NULL',
                  ofType: {
                    name: 'String',
                    kind: 'SCALAR',
                    ofType: null
                  }
                }
              }
            },
            '[String!]!'
          ]
        ].forEach(([type, signature]) => {
          expect(
            aotf.argumentSignature({
              name: 'myArgument',
              type: type
            })
          ).to.equal(signature)
        })
      })
    })

    describe('getNullValue', () => {
      it('should pick appropriate default types', () => {
        [
          [ // String => null
            {
              type: 'String',
              kind: 'SCALAR'
            },
            [],
            null
          ],
          [ // NON_NULL<String> => null
            {
              type: null,
              kind: 'NON_NULL',
              ofType: {
                type: 'String',
                kind: 'SCALAR'
              }
            },
            [],
            null
          ],
          [ // LIST<String> => []
            {
              type: null,
              kind: 'LIST',
              ofType: {
                type: 'String',
                kind: 'SCALAR'
              }
            },
            [],
            []
          ],
          [ // LIST<LIST<String>> => [[]]
            {
              type: null,
              kind: 'LIST',
              ofType: {
                type: null,
                kind: 'LIST',
                ofType: {
                  type: 'String',
                  kind: 'SCALAR'
                }
              }
            },
            [],
            [[]]
          ],
          [ // NON_NULL<LIST<String>> => []
            {
              type: null,
              kind: 'NON_NULL',
              ofType: {
                type: null,
                kind: 'LIST',
                ofType: {
                  type: 'String',
                  kind: 'SCALAR'
                }
              }
            },
            [],
            []
          ],
          [ // INPUT_OBJECT { A } => {A: null}
            {
              type: null,
              kind: 'INPUT_OBJECT',
              name: 'A'
            },
            [
              {
                name: 'A',
                kind: 'INPUT_OBJECT',
                inputFields: [
                  {
                    name: 'A',
                    type: 'String'
                  }
                ]
              }
            ],
            { A: null }
          ]
        ].forEach((item) => {
          const type = item[0]
          const types = item[1]
          expect(
            aotf.getNullValue(type, types)
          ).to.deep.equal(
            item[2]
          )
        })
      })
    })

    describe('constructMutation', () => {
      it('populates with basic argument inputs', () => {
        const mutation = {
          name: 'MyMutation',
          args: [
            {
              name: 'foo',
              type: {
                name: 'String',
                kind: 'SCALAR',
                ofType: null
              }
            },
            {
              name: 'bar',
              type: {
                name: 'Int',
                kind: 'SCALAR',
                ofType: null
              }
            }
          ]
        }
        expect(aotf.constructMutation(mutation)).to.equal(dedent`
          mutation MyMutation($foo: String, $bar: Int) {
            MyMutation(foo: $foo, bar: $bar) {
              result
            }
          }
        `.trim())
      })

      it('handles nested types', () => {
        const mutation = {
          name: 'MyMutation',
          args: [
            {
              name: 'myArg',
              type: {
                name: null,
                kind: 'NON_NULL',
                ofType: {
                  name: null,
                  kind: 'LIST',
                  ofType: {
                    name: 'String',
                    kind: 'SCALAR',
                    ofType: null
                  }
                }
              }
            }
          ]
        }
        expect(aotf.constructMutation(mutation)).to.equal(dedent`
          mutation MyMutation($myArg: [String]!) {
            MyMutation(myArg: $myArg) {
              result
            }
          }
        `.trim())
      })
    })
  })
})
