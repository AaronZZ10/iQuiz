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
RUN jar tf /app/app.jar | grep -F "com/aaronzz10/iquiz_server_java/IQuizJavaApplication.class"
RUN sh -lc 'jar xf /app/app.jar META-INF/MANIFEST.MF && sed -n "1,40p" META-INF/MANIFEST.MF'