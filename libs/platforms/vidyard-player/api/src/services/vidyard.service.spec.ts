import { VidyardService } from './vidyard.service';

describe('VidyardService', () => {
  let service: VidyardService;

  beforeEach(() => {
    service = new VidyardService();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
