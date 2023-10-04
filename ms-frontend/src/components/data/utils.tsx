import React, { ReactNode, Children } from 'react';

export const isGhostNode = (x: unknown, name?: string): boolean => {
  if (typeof x !== 'object' || x === null)
    return false;
  return (name === undefined || name === '') && Object.keys(x)[0] === 'children';
};

export const expandGhostNodes = (children: ReactNode | ReactNode[]) => {
  let childArr = Children.toArray(children);
  let hasGhostNode = true;
  while (hasGhostNode) {
    let newChildArr = childArr.slice(0, 0);
    hasGhostNode = false;
    for (const child of childArr) {
      if (React.isValidElement(child)
        && typeof child.type !== 'string'
        && isGhostNode(child.props, child.type.name)) {
        hasGhostNode = true;
        newChildArr = newChildArr.concat(Children.toArray(child.props.children));
      } else
        newChildArr.push(child);
    }
    childArr = newChildArr;
  }
  return childArr;
};