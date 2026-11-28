import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {ServerStyleSheet} from 'styled-components';
import CustomViewV2 from '@/popup/component/CustomViewV2';

jest.mock('react-router-dom', () => ({useNavigate: () => jest.fn()}));
jest.mock('@/utils/browserUtils', () => ({copyText: jest.fn()}));
jest.mock('@/popup/component/Toast', () => ({info: jest.fn()}));
jest.mock('styled-components', () => {
  // The shared Jest setup supplies a minimal window; initialize the real SSR renderer without it.
  const originalWindow = globalThis.window;
  Object.defineProperty(globalThis, 'window', {value: undefined});
  try {
    return jest.requireActual('styled-components');
  } finally {
    Object.defineProperty(globalThis, 'window', {value: originalWindow});
  }
});

function renderTitle(truncateTitle?: boolean) {
  const originalWindow = globalThis.window, originalDocument = globalThis.document;
  Object.defineProperty(globalThis, 'window', {value: undefined});
  Object.defineProperty(globalThis, 'document', {value: undefined});
  const sheet = new ServerStyleSheet();
  try {
    const html = renderToStaticMarkup(sheet.collectStyles(React.createElement(CustomViewV2, {
      title: 'Asset name', subTitle: 'Token name', copyContent: 'token-id', truncateTitle,
    })));
    return {html, css: sheet.getStyleTags()};
  } finally {
    sheet.seal();
    Object.defineProperty(globalThis, 'window', {value: originalWindow});
    Object.defineProperty(globalThis, 'document', {value: originalDocument});
  }
}

describe('NFT title styling stays scoped to its caller', () => {
  it('preserves the original Token header by default', () => {
    const {html, css} = renderTitle();
    expect(html).toContain('Token name');
    expect(html).toContain('icon_copy_black.svg');
    expect(html).not.toContain('title="Asset name"');
    expect(css).not.toContain('max-width:calc(100% - 100px)');
    expect(css).not.toContain('text-overflow:ellipsis');
  });

  it('limits a long NFT title without changing a later default header', () => {
    const nft = renderTitle(true);
    expect(nft.html).toContain('title="Asset name"');
    expect(nft.css).toContain('max-width:calc(100% - 100px)');
    expect(nft.css).toContain('text-overflow:ellipsis');
    const token = renderTitle();
    expect(token.css).not.toContain('text-overflow:ellipsis');
  });
});
