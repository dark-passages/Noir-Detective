/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from 'react';

let activeModalLocks = 0;
let savedScrollY = 0;
let savedBodyOverflow = '';
let savedHtmlOverflow = '';
let savedBodyOverscroll = '';
let savedHtmlOverscroll = '';
let savedBodyPosition = '';
let savedBodyTop = '';
let savedBodyLeft = '';
let savedBodyRight = '';
let savedBodyWidth = '';
let savedBodyPaddingRight = '';

/**
 * Reference-counted scroll lock so nested modals (e.g. MugshotModal inside
 * InterrogationModal) keep the background page locked until all modals close.
 */
export function lockPageScroll(): () => void {
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    return () => {};
  }

  if (activeModalLocks === 0) {
    savedScrollY = window.scrollY;
    const docStyle = document.documentElement.style;
    const bodyStyle = document.body.style;

    savedHtmlOverflow = docStyle.overflow;
    savedHtmlOverscroll = docStyle.overscrollBehavior;
    savedBodyOverflow = bodyStyle.overflow;
    savedBodyOverscroll = bodyStyle.overscrollBehavior;
    savedBodyPosition = bodyStyle.position;
    savedBodyTop = bodyStyle.top;
    savedBodyLeft = bodyStyle.left;
    savedBodyRight = bodyStyle.right;
    savedBodyWidth = bodyStyle.width;
    savedBodyPaddingRight = bodyStyle.paddingRight;

    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    docStyle.overflow = 'hidden';
    docStyle.overscrollBehavior = 'none';
    bodyStyle.overflow = 'hidden';
    bodyStyle.overscrollBehavior = 'none';
    bodyStyle.position = 'fixed';
    bodyStyle.top = `-${savedScrollY}px`;
    bodyStyle.left = '0';
    bodyStyle.right = '0';
    bodyStyle.width = '100%';
    if (scrollbarWidth > 0) {
      const existingPadding = parseFloat(window.getComputedStyle(document.body).paddingRight) || 0;
      bodyStyle.paddingRight = `${existingPadding + scrollbarWidth}px`;
    }
  }

  activeModalLocks += 1;

  let released = false;
  return () => {
    if (released) return;
    released = true;
    activeModalLocks = Math.max(0, activeModalLocks - 1);
    if (activeModalLocks === 0) {
      const docStyle = document.documentElement.style;
      const bodyStyle = document.body.style;

      docStyle.overflow = savedHtmlOverflow;
      docStyle.overscrollBehavior = savedHtmlOverscroll;
      bodyStyle.overflow = savedBodyOverflow;
      bodyStyle.overscrollBehavior = savedBodyOverscroll;
      bodyStyle.position = savedBodyPosition;
      bodyStyle.top = savedBodyTop;
      bodyStyle.left = savedBodyLeft;
      bodyStyle.right = savedBodyRight;
      bodyStyle.width = savedBodyWidth;
      bodyStyle.paddingRight = savedBodyPaddingRight;

      window.scrollTo(0, savedScrollY);
    }
  };
}

export function useModalScrollLock(active = true): void {
  useEffect(() => {
    if (!active) return;
    return lockPageScroll();
  }, [active]);
}
