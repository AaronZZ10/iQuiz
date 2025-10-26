# ---- Build stage ----
FROM maven:3.9.8-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn -q -e -DskipTests dependency:go-offline
COPY src ./src
# 🔎 Verify build context and sources exist (printed in Render build logs)
RUN set -eux; \
    echo '--- CWD & listing ---'; pwd; ls -la; \
    echo '--- Has pom.xml? ---'; [ -f pom.xml ] && echo YES || (echo NO && exit 1); \
    echo '--- Java sources present? (first 40) ---'; find src/main/java -type f | sed -n '1,40p'; \
    echo '--- Searching for IQuizJavaApplication.java ---'; \
    MAIN_CLASS=$(find src/main/java -name IQuizJavaApplication.java | head -n 1); \
    if [ -z "$MAIN_CLASS" ]; then echo '❌ Missing main class file!'; exit 1; else echo "✅ Found main class at: $MAIN_CLASS"; fi
RUN mvn -q -DskipTests clean package spring-boot:repackage

# copy the exec jar to a fixed name
RUN set -eux; \
    JAR_FILE=$(ls target/*-exec.jar | head -n 1); \
    echo "Using $JAR_FILE"; \
    cp "$JAR_FILE" /app/app.jar

# ✅ DIAGNOSTIC: list jar contents & manifest in build logs (deeper)
RUN set -eux; \
    jar tf /app/app.jar | tee /tmp/jar.txt | sed -n '1,200p'; \
    echo '--- searching for application class (full path) ---'; \
    grep -F 'BOOT-INF/classes/com/aaronzz10/iquiz_server_java/IQuizJavaApplication.class' /tmp/jar.txt || true; \
    echo '--- manifest ---'; \
    jar xf /app/app.jar META-INF/MANIFEST.MF; \
    sed -n '1,120p' META-INF/MANIFEST.MF || true

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