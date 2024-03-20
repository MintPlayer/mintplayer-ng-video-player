import { WistiaService } from './wistia.service';

describe('WistiaService', () => {
  let service: WistiaService;

  beforeEach(() => {
    service = new WistiaService();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
