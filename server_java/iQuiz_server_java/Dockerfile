# ---- Build stage ----
FROM maven:3.9.8-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn -q -e -DskipTests dependency:go-offline
COPY src ./src
# clean build + repackage to create *-exec.jar
RUN mvn -q -DskipTests clean package spring-boot:repackage
# copy the exec jar to a fixed name
RUN set -eux; \
    JAR_FILE=$(ls target/*-exec.jar | head -n 1); \
    echo "Using $JAR_FILE"; \
    cp "$JAR_FILE" /app/app.jar

# ---- Run stage ----
FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /app/app.jar /app/app.jar
ENV JAVA_OPTS="-Xms256m -Xmx512m"
EXPOSE 8080
CMD ["sh","-c","java $JAVA_OPTS -Dserver.port=${PORT:-8080} -jar /app/app.jar"]