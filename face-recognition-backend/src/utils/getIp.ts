export default (req: any) =>
    req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress;