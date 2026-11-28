import { isTrustedBuildOrigin } from '@/utils/utils';

describe('Token and NFT builder origin', () => {
  const configured = 'https://builder.example/nft';

  it('accepts the configured HTTPS origin for either build page', () => {
    expect(isTrustedBuildOrigin('https://builder.example', configured)).toBe(true);
    expect(isTrustedBuildOrigin('https://builder.example:443', configured)).toBe(true);
  });

  it.each([
    'https://other.example',
    'https://builder.example.evil.example',
    'https://builder.example:8443',
    'http://builder.example',
    'invalid-url',
  ])('rejects an unexpected origin: %s', origin => {
    expect(isTrustedBuildOrigin(origin, configured)).toBe(false);
  });

  it.each(['http://localhost:8080', 'http://127.0.0.1:8080', 'http://[::1]:8080'])(
    'rejects the retired local HTTP configuration: %s', origin => {
      expect(isTrustedBuildOrigin(origin, origin)).toBe(false);
    },
  );

  it.each(['', 'invalid-url'])(
    'rejects an invalid builder configuration: %s', url => {
      expect(isTrustedBuildOrigin('https://builder.example', url)).toBe(false);
    },
  );
});
