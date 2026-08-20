export const ok = (res, data, message = "OK", status = 200) =>
  res.status(status).json({ success: true, message, data });

export const fail = (res, message = "Error", status = 400, extra) =>
  res.status(status).json({ success: false, message, ...extra });
