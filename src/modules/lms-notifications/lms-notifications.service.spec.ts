import { Test, TestingModule } from '@nestjs/testing';
import { LmsNotificationsService } from './lms-notifications.service';

describe('LmsNotificationsService', () => {
  let service: LmsNotificationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LmsNotificationsService],
    }).compile();

    service = module.get<LmsNotificationsService>(LmsNotificationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
