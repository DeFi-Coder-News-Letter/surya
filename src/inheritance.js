"use strict";

const fs = require('fs')
const parser = require('solidity-parser-antlr')
const graphviz = require('graphviz')
const { linearize } = require('c3-linearization')

export function inheritance(files) {
    const digraph = graphviz.digraph('G')
    digraph.set('ratio', 'auto')
    digraph.set('page', '40')

    for (let file of files) {

      let content
      try {
        content = fs.readFileSync(file).toString('utf-8')
      } catch (e) {
        if (e.code === 'EISDIR') {
          console.error(`Skipping directory ${file}`)
          continue
        } else throw e;
      }

      const ast = parser.parse(content)

      let contractName = null
      let cluster = null
      let dependencies = {}

      parser.visit(ast, {
        ContractDefinition(node) {
          contractName = node.name

          if (!digraph.getNode(contractName)) {
            let opts = {
              label: contractName,
              color: 'gray'
            }

            digraph.addNode(contractName)
          }


          dependencies[contractName] = node.baseContracts.map(spec =>
            spec.baseName.namePath
          )

          for (let dep of dependencies[contractName]) {
            if (!digraph.getNode(dep)) {
              let opts = {
                label: dep,
                color: 'gray'
              }

              digraph.addNode(dep)
            }

            digraph.addEdge(contractName, dep)
          }
        }
      })

      dependencies = linearize(dependencies)
    }

    console.log(digraph.to_dot())
}
