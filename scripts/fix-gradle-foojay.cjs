const fs = require('fs');
const path = require('path');

const OLD_VERSION = '0.5.0';
const FIXED_VERSION = '1.0.0';
const PLUGIN_ID = 'org.gradle.toolchains.foojay-resolver-convention';

function patchFile(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Arquivo do Gradle Plugin do React Native nao encontrado: ${filePath}`);
  }

  const original = fs.readFileSync(filePath, 'utf8');
  const pluginRegex = new RegExp(
    `(id\\(["']${PLUGIN_ID.replace(/\./g, '\\.')}["']\\)\\.version\\(["'])([^"']+)(["']\\))`,
  );
  const match = original.match(pluginRegex);

  if (!match) {
    throw new Error(
      `Nao foi possivel localizar ${PLUGIN_ID} em ${filePath}. ` +
        'A estrutura do @react-native/gradle-plugin pode ter mudado.',
    );
  }

  const currentVersion = match[2];

  if (currentVersion === FIXED_VERSION) {
    return { changed: false, from: currentVersion, to: FIXED_VERSION };
  }

  // RN 0.83.x do Expo SDK 55 pode vir com 0.5.0, que usa IBM_SEMERU,
  // removido no Gradle 9. A versao 1.0.0 remove essa referencia.
  if (currentVersion === OLD_VERSION || currentVersion.startsWith('0.')) {
    const updated = original.replace(pluginRegex, `$1${FIXED_VERSION}$3`);
    fs.writeFileSync(filePath, updated, 'utf8');
    return { changed: true, from: currentVersion, to: FIXED_VERSION };
  }

  // Se uma futura versao do React Native ja trouxer 1.x ou superior,
  // nao fazemos downgrade nem alteramos uma configuracao mais nova.
  return { changed: false, from: currentVersion, to: currentVersion };
}

function defaultPluginSettingsPath(projectRoot = process.cwd()) {
  return path.join(
    projectRoot,
    'node_modules',
    '@react-native',
    'gradle-plugin',
    'settings.gradle.kts',
  );
}

function main() {
  const filePath = process.env.RN_GRADLE_PLUGIN_SETTINGS || defaultPluginSettingsPath();
  const result = patchFile(filePath);

  if (result.changed) {
    console.log(
      `[gradle-fix] ${PLUGIN_ID}: ${result.from} -> ${result.to}`,
    );
  } else {
    console.log(
      `[gradle-fix] ${PLUGIN_ID}: ${result.from} (nenhuma alteracao necessaria)`,
    );
  }
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(`[gradle-fix] ERRO: ${error.message}`);
    process.exit(1);
  }
}

module.exports = {
  OLD_VERSION,
  FIXED_VERSION,
  PLUGIN_ID,
  patchFile,
  defaultPluginSettingsPath,
};
