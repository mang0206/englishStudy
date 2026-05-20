# ========== Build Stage ==========
FROM gradle:8.10-jdk17-alpine AS builder

WORKDIR /workspace

COPY build.gradle settings.gradle ./
COPY src ./src

RUN gradle bootJar --no-daemon

# ========== Runtime Stage ==========
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

COPY --from=builder /workspace/build/libs/app.jar app.jar

EXPOSE 8080

ENV JAVA_OPTS="-Xms256m -Xmx512m"

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
