import axios from "axios";
import { WebhookClient, EmbedBuilder } from "discord.js";
import * as dotenv from "dotenv";
import * as fs from "fs";

dotenv.config();

const webhookUrl = process.env.DISCORD_WEBHOOK;
const webhookClient = new WebhookClient({ url: webhookUrl });
const packageName = "envio";
const versionStoragePath = "version.json";

const writeVersion = (version: string) => {
  fs.writeFileSync(versionStoragePath, JSON.stringify({ version: version }));
};

const readVersion = () => {
  return fs.readFileSync(versionStoragePath, "utf8");
};

let currentVersion = readVersion();

const fetchPackageInfo = async (packageName: string) => {
  try {
    const response = await axios.get(
      `https://registry.npmjs.org/${packageName}`
    );
    return response.data;
  } catch (error) {
    console.error(`Error fetching package info for ${packageName}: ${error}`);
    throw error;
  }
};

const sendDiscordMessage = (message: string) => {
  const embed = new EmbedBuilder()
    .setTitle("Package Update Notification")
    .setDescription(message);

  webhookClient.send({ embeds: [embed] });
};

const checkPackageForUpdate = async () => {
  try {
    const packageInfo = await fetchPackageInfo(packageName);
    const latestVersion = packageInfo["dist-tags"]["latest"];

    currentVersion = readVersion();

    if (latestVersion !== JSON.parse(currentVersion).version) {
      currentVersion = latestVersion;
      writeVersion(latestVersion);
      console.log(`New version of ${packageName} (${latestVersion})`);
      sendDiscordMessage(
        `New version of ${packageName} (${latestVersion}) has been published to 'latest' cc: @Devs.`
      );
    }
  } catch (error) {
    console.log(error);
  }
};

const pollForUpdatesEveryMin = () => {
  checkPackageForUpdate();
  setTimeout(pollForUpdatesEveryMin, 60_000); // 1 min
};

pollForUpdatesEveryMin();
