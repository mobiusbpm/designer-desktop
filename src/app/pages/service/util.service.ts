import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UtilService {

  stringHashCode(str: string): number {
    let hash = 0;
    if (str.length === 0) return hash;
    const normalizeXml = (xml: string) => xml.replace(/\s+/g, '').trim();
    str = normalizeXml(str);
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char; // Bitwise operations for hash generation
      hash = hash & hash; // Convert to 32-bit integer
    }

    return hash;
  }

  compareNodes(node1: any, node2: any): boolean {
    // Check if node types are different
    if (node1.nodeType !== node2.nodeType) {
      return false;
    }

    // Compare node names
    if (node1.nodeName !== node2.nodeName) {
      return false;
    }

    // Compare attributes
    if (node1.attributes && node2.attributes) {
      if (node1.attributes.length !== node2.attributes.length) {
        return false;
      }
      for (let i = 0; i < node1.attributes.length; i++) {
        let attr1 = node1.attributes[i];
        let attr2 = node2.attributes[i];
        if (attr1.name !== attr2.name || attr1.value !== attr2.value) {
          return false;
        }
      }
    }

    // Compare child nodes recursively
    if (node1.childNodes.length !== node2.childNodes.length) {
      return false;
    }
    for (let i = 0; i < node1.childNodes.length; i++) {
      let childNode1 = node1.childNodes[i];
      let childNode2 = node2.childNodes[i];
      if (!this.compareNodes(childNode1, childNode2)) {
        return false;
      }
    }
    // Nodes are equal
    return true;
  }
}
