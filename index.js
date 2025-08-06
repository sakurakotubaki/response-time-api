const express = require('express');
const app = express();
const port = 9080;

// 時間帯設定データ
const timeSettings = [
  {
    id: 'new-number',
    startTime: '0:00',
    endTime: '23:15',
    title: '新しい番号、機種変更'
  },
  {
    id: 'ore-chan-phone',
    startTime: '5:00',
    endTime: '23:15',
    title: '俺ちゃんフォーン'
  },
  {
    id: 'carrier-change',
    startTime: '9:00',
    endTime: '21:00',
    title: '他社から乗り換え'
  }
];

// 時間文字列を分に変換する関数
function timeToMinutes(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

// 現在時刻が指定された時間範囲内かどうかをチェックする関数
function isWithinTimeRange(startTime, endTime) {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);
  
  return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
}

// API エンドポイント
app.get('/api/v1/open-time/:parameter', (req, res) => {
  const parameter = req.params.parameter;
  
  // パラメータに一致する設定を検索
  const setting = timeSettings.find(item => item.id === parameter);
  
  if (!setting) {
    return res.status(404).json({
      error: 'Parameter not found',
      message: `設定が見つかりません: ${parameter}`
    });
  }
  
  // 現在時刻が営業時間内かどうかをチェック
  const isOpen = isWithinTimeRange(setting.startTime, setting.endTime);
  
  res.json({
    parameter: parameter,
    isOpen: isOpen,
    startTime: setting.startTime,
    endTime: setting.endTime,
    title: setting.title,
    currentTime: new Date().toLocaleTimeString('ja-JP', { hour12: false })
  });
});

// 全ての設定一覧を取得するエンドポイント
app.get('/api/v1/open-time', (req, res) => {
  const currentTime = new Date();
  const results = timeSettings.map(setting => ({
    parameter: setting.id,
    isOpen: isWithinTimeRange(setting.startTime, setting.endTime),
    startTime: setting.startTime,
    endTime: setting.endTime,
    title: setting.title
  }));
  
  res.json({
    currentTime: currentTime.toLocaleTimeString('ja-JP', { hour12: false }),
    settings: results
  });
});

// ヘルスチェック用エンドポイント
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(port, () => {
  console.log(`Response Time API サーバーが http://localhost:${port} で起動しました`);
  console.log('利用可能なエンドポイント:');
  console.log(`- GET /api/v1/open-time/:parameter`);
  console.log(`- GET /api/v1/open-time`);
  console.log(`- GET /health`);
  console.log('\n利用可能なパラメータ:');
  timeSettings.forEach(setting => {
    console.log(`- ${setting.id}: ${setting.title} (${setting.startTime} - ${setting.endTime})`);
  });
});
