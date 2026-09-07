/* eslint-env jest */
/**
 * The iPad column must be purely additive: on a phone `column` has to be
 * null so every existing style resolves exactly as it did before.
 */
const loadTheme = (width: number) => {
  let common: typeof import('../src/theme/common');
  let tokens: typeof import('../src/theme/tokens');
  jest.isolateModules(() => {
    const {Dimensions} = require('react-native');
    jest
      .spyOn(Dimensions, 'get')
      .mockReturnValue({width, height: 1000, scale: 2, fontScale: 1});
    tokens = require('../src/theme/tokens');
    common = require('../src/theme/common');
  });
  return {column: common!.column, scale: tokens!.SCALE};
};

describe('iPad column', () => {
  it.each([
    ['iPhone SE', 375],
    ['iPhone 14', 390],
    ['iPhone 14 Pro Max', 430],
    ['narrow Split View', 320],
  ])('stays inert on %s (%ipt)', (_name, width) => {
    expect(loadTheme(width).column).toBeNull();
  });

  it.each([
    ['iPad mini portrait', 744],
    ['iPad 10.9 portrait', 820],
    ['iPad Pro 12.9 portrait', 1024],
    ['iPad Pro 12.9 landscape', 1366],
  ])('constrains %s (%ipt)', (_name, width) => {
    expect(loadTheme(width).column).toEqual({
      width: '100%',
      maxWidth: 680,
      alignSelf: 'center',
    });
  });

  it('caps the scale on every iPad size, so rotation cannot restyle', () => {
    const sizes = [744, 820, 1024, 1180, 1366];
    const scales = sizes.map(w => loadTheme(w).scale);
    expect(new Set(scales).size).toBe(1);
    expect(scales[0]).toBeCloseTo(1.55);
  });
});
