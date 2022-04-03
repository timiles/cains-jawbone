export default (config, env, helpers) => {
  if (process.env.NODE_ENV === "production") {
    config.output.publicPath = "/cains-jawbone/";
  }
};
