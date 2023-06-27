version_settings(constraint=">=0.22.2")

docker_build(
    "freiburg-convention",
    context=".",
    dockerfile="Dockerfile.development",
    #only=["app/", "package.json", "package-lock.json", "remix.config.js", "server.js", "remix.env.d.ts", "tsconfig.json", "temp"],
    live_update=[
        fall_back_on(["package.json", "package-lock.json", "Dockerfile.development"]),
        sync("./", "/frontend/")
    ],
)

k8s_yaml(
  "deploy/frontend.yaml"
)

k8s_resource("frontend", port_forwards="0.0.0.0:3000:3000", labels=["frontend"])
