const endpoint = "https://individual-llama-d4e2yugb3aeb228-1524145598.ap-shanghai.app.tcloudbase.com/gobeginner/dev/v1";

export function request(body, timeout = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  return fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: controller.signal,
  }).finally(() => clearTimeout(timer)).then(async (response) => {
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(data.error || "网络请求失败");
      error.status = response.status;
      throw error;
    }
    return data;
  });
}

export function ping() {
  return request({ action: "ping" });
}
