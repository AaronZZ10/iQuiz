# ---- Build stage ----
FROM maven:3.9.8-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn -q -e -DskipTests dependency:go-offline
COPY src ./src
RUN mvn -q -DskipTests clean package spring-boot:repackage

# copy the exec jar to a fixed name
RUN set -eux; \
    JAR_FILE=$(ls target/*-exec.jar | head -n 1); \
    echo "Using $JAR_FILE"; \
    cp "$JAR_FILE" /app/app.jar

# ✅ VERIFY jar content + manifest during build (shown in Render build logs)
# ✅ DIAGNOSTIC: list jar contents & manifest in build logs
RUN set -eux; \
    jar tf /app/app.jar | tee /tmp/jar.txt | sed -n '1,80p'; \
    echo '--- searching for application class ---'; \
    grep -F "IQuizJavaApplication.class" /tmp/jar.txt || true; \
    echo '--- manifest ---'; \
    jar xf /app/app.jar META-INF/MANIFEST.MF; \
    sed -n '1,80p' META-INF/MANIFEST.MF || true

# ---- Run stage ----
FROM eclipse-temurin:17-jre
WORKDIR /app

# Copy the bootable jar from build stage
COPY --from=build /app/app.jar /app/app.jar

# Optional JVM defaults (picked up automatically by Java)
ENV JAVA_TOOL_OPTIONS="-Xms256m -Xmx512m"

# Expose container port (Render injects PORT env; Spring maps server.port from it)
EXPOSE 8080

# Use exec-form to avoid shell/env expansion issues on Render
ENTRYPOINT ["java"]
CMD ["-jar", "/app/app.jar"]