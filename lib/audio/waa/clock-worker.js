/* global URL Blob Worker */

module.exports = function clock (options = {}) {
  const lookAhead = options.lookAhead || 0.1
  const updateInterval = 1000 * lookAhead / 3
  const callback = options.callback || (() => {})
  worker(updateInterval).addEventListener("message", () => {
    callback()
  })
}

function worker (updateInterval) {
  const src = new Blob([`
    let timeout = ${updateInterval};
    self.onmessage = function (msg) {
      timeout = parseInt(msg.data);
    };
    function tick () {
      setTimeout(tick, timeout)
      self.postMessage('tick')
    };
    tick();
  `])
  return new Worker(URL.createObjectURL(src))
}
