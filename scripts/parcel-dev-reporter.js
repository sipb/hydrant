const { Reporter } = require('@parcel/plugin');
const { fork } = require('child_process');

/** @type {import('child_process').ChildProcess | null} */
let startedProc = null;
let reloadingProc = false;

process.on('exit', () => {
  startedProc?.kill();
});

/**
 * @param {import('@parcel/types').ReporterEvent} event
 * @param {import('@parcel/types').PluginLogger} logger
 */
async function startNodeServer(event, logger) {
  if (reloadingProc) return;
  reloadingProc = true;
  if (event.type === 'buildSuccess') {
    const bundles = event.bundleGraph.getBundles();
    if (bundles.length !== 1 || bundles[0].target.name !== 'backend') {
      return;
    }

    if (startedProc) {
      const procDied = new Promise(resolve => {
        startedProc.once('exit', () => resolve(true));
      });
      startedProc.kill();

      const dead = await Promise.race([
        new Promise(resolve => setTimeout(() => resolve(false), 1000)),
        procDied
      ]);

      if (!dead) {
        startedProc.kill('SIGKILL');
        await Promise.race([
          new Promise(resolve => setTimeout(resolve, 500)),
          procDied
        ]);
      }
    }

    startedProc = fork(bundles[0].filePath, {
      stdio: 'inherit'
    });
    startedProc.on('error', err => {
      logger.origin = 'Live reload';
      logger.error(err);
      startedProc = null;
    });
    startedProc.on('exit', () => {
      startedProc = null;
    });
  }
  reloadingProc = false;
}

module.exports = new Reporter({
  async report({ event, logger }) {
    await startNodeServer(event, logger)
  }
})