const mockClient = {
  on: jest.fn().mockReturnThis(),
  subscribe: jest.fn((_topics: unknown, cb?: (err: null) => void) => {
    if (cb) cb(null);
  }),
  publish: jest.fn(),
  end: jest.fn(),
  endAsync: jest.fn().mockResolvedValue(undefined),
  removeAllListeners: jest.fn().mockReturnThis(),
  connected: false,
};

export const connect = jest.fn(() => mockClient);
