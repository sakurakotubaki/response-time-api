const request = require('supertest');
const app = require('../index.js');

describe('Response Time API', () => {
  describe('GET /health', () => {
    test('ヘルスチェックエンドポイントが正常に動作する', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);
      
      expect(response.body).toHaveProperty('status', 'OK');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('GET /api/v1/open-time', () => {
    test('全ての設定一覧を取得できる', async () => {
      const response = await request(app)
        .get('/api/v1/open-time')
        .expect(200);
      
      expect(response.body).toHaveProperty('currentTime');
      expect(response.body).toHaveProperty('settings');
      expect(Array.isArray(response.body.settings)).toBe(true);
      expect(response.body.settings).toHaveLength(3);
      
      // 各設定が期待される構造を持っているかチェック
      response.body.settings.forEach(setting => {
        expect(setting).toHaveProperty('parameter');
        expect(setting).toHaveProperty('isOpen');
        expect(setting).toHaveProperty('startTime');
        expect(setting).toHaveProperty('endTime');
        expect(setting).toHaveProperty('title');
        expect(typeof setting.isOpen).toBe('boolean');
      });
    });
  });

  describe('GET /api/v1/open-time/:parameter', () => {
    test('有効なパラメータで営業時間情報を取得できる - new-number', async () => {
      const response = await request(app)
        .get('/api/v1/open-time/new-number')
        .expect(200);
      
      expect(response.body).toEqual({
        parameter: 'new-number',
        isOpen: expect.any(Boolean),
        startTime: '0:00',
        endTime: '23:15',
        title: '新しい番号、機種変更',
        currentTime: expect.any(String)
      });
    });

    test('有効なパラメータで営業時間情報を取得できる - ore-chan-phone', async () => {
      const response = await request(app)
        .get('/api/v1/open-time/ore-chan-phone')
        .expect(200);
      
      expect(response.body).toEqual({
        parameter: 'ore-chan-phone',
        isOpen: expect.any(Boolean),
        startTime: '5:00',
        endTime: '23:15',
        title: '俺ちゃんフォーン',
        currentTime: expect.any(String)
      });
    });

    test('有効なパラメータで営業時間情報を取得できる - carrier-change', async () => {
      const response = await request(app)
        .get('/api/v1/open-time/carrier-change')
        .expect(200);
      
      expect(response.body).toEqual({
        parameter: 'carrier-change',
        isOpen: expect.any(Boolean),
        startTime: '9:00',
        endTime: '21:00',
        title: '他社から乗り換え',
        currentTime: expect.any(String)
      });
    });

    test('無効なパラメータで404エラーが返される', async () => {
      const response = await request(app)
        .get('/api/v1/open-time/invalid-parameter')
        .expect(404);
      
      expect(response.body).toEqual({
        error: 'Parameter not found',
        message: '設定が見つかりません: invalid-parameter'
      });
    });
  });

  describe('時間チェック関数のテスト', () => {
    // 時間チェック関数を直接テストするために、モジュールから関数を取得
    let originalDate;
    
    beforeEach(() => {
      originalDate = Date;
    });
    
    afterEach(() => {
      global.Date = originalDate;
    });
    
    test('営業時間内の場合にisOpenがtrueになる', async () => {
      // 午前10時にモック
      const mockDate = new Date('2023-01-01T10:00:00');
      global.Date = jest.fn(() => mockDate);
      global.Date.now = jest.fn(() => mockDate.getTime());
      
      const response = await request(app)
        .get('/api/v1/open-time/new-number')
        .expect(200);
      
      expect(response.body.isOpen).toBe(true);
    });
    
    test('営業時間外の場合にisOpenがfalseになる', async () => {
      // 午前8時にモック (carrier-changeは9時から開始)
      const mockDate = new Date('2023-01-01T08:00:00');
      global.Date = jest.fn(() => mockDate);
      global.Date.now = jest.fn(() => mockDate.getTime());
      
      const response = await request(app)
        .get('/api/v1/open-time/carrier-change')
        .expect(200);
      
      expect(response.body.isOpen).toBe(false);
    });
  });

  describe('エラーハンドリング', () => {
    test('存在しないエンドポイントで404が返される', async () => {
      await request(app)
        .get('/api/v1/nonexistent')
        .expect(404);
    });
  });
});
