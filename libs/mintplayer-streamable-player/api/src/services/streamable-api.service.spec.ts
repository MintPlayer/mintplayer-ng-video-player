import { StreamableService } from './streamable-api.service';

describe('StreamableService', () => {
  let service: StreamableService;

  beforeEach(() => {
    service = new StreamableService();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
