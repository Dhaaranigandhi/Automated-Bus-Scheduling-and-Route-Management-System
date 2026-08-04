import { updateDriver } from './controllers/driverController';

async function test() {
  const req: any = {
    params: { id: '4' },
    body: {
      licenseNumber: 'DL-2026-0001',
      licenseExpiry: '2035-12-31',
      medicalStatus: 'FIT',
      availabilityStatus: 'AVAILABLE',
      performanceScore: 4.8
    }
  };

  const res: any = {
    status: function(s: number) {
      this.statusCode = s;
      return this;
    },
    json: function(data: any) {
      console.log('Response JSON:', this.statusCode, data);
    }
  };

  const next = function(err: any) {
    console.log('Error caught by next:', err);
    if (err) console.log(err.stack);
  };

  await updateDriver(req, res, next);
}

test();
