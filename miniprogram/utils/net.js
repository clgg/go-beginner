const endpoint = "https://individual-llama-d4e2yugb3aeb228-1524145598.ap-shanghai.app.tcloudbase.com/gobeginner/dev/v1";

function request(body, timeout = 8000) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: endpoint,
      method: "POST",
      data: body,
      timeout,
      header: { "Content-Type": "application/json" },
      success(res) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data || {});
          return;
        }
        const error = new Error((res.data && res.data.error) || "网络请求失败");
        error.status = res.statusCode;
        reject(error);
      },
      fail(error) {
        reject(error);
      },
    });
  });
}

function ping() {
  return request({ action: "ping" });
}

module.exports = { request, ping };
