# ---- Build stage ----
FROM maven:3.9.8-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn -q -e -DskipTests dependency:go-offline
COPY src ./src
# build + repackage a bootable Spring Boot fat jar (adds Main-Class)
RUN mvn -q -DskipTests package spring-boot:repackage

# produce a single, predictable artifact name
RUN set -eux; \
    JAR_FILE=$(ls target/*.jar | head -n 1); \
    echo "Using $JAR_FILE"; \
    cp "$JAR_FILE" /app/app.jar

# ---- Run stage ----
FROM eclipse-temurin:17-jre
WORKDIR /app

# Copy the built jar from previous stage
COPY --from=build /app/app.jar /app/app.jar

# Render provides $PORT; pass it to Spring via -Dserver.port
ENV JAVA_OPTS="-Xms256m -Xmx512m"
EXPOSE 8080
CMD ["sh","-c","java $JAVA_OPTS -Dserver.port=${PORT:-8080} -jar /app/app.jar"]