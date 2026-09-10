import logging

from dotenv import load_dotenv
from livekit.agents import (
    Agent,
    AgentServer,
    AgentSession,
    AudioConfig,
    BackgroundAudioPlayer,
    BuiltinAudioClip,
    JobContext,
    TurnHandlingOptions,
    cli,
)
from livekit.agents.beta.tools import EndCallTool
from livekit.plugins import deepgram, gradium, openai, silero
from livekit.plugins.turn_detector.multilingual import MultilingualModel
from prompt_loader import load_session_prompts

logger = logging.getLogger("numa-agent-en")

load_dotenv(".env.local")

DEFAULT_SYSTEM = (
    "You're a voice agent for a company called Numa IQ and you were created by them"
)
DEFAULT_GREETING = "Hello, this is a Numa IQ voice agent, how can I help you?"

# Port 8081 when running alongside FR (8082) and AR (8083) agents.
server = AgentServer(port=8081)


@server.rtc_session(agent_name="numa-agent-en")
async def entrypoint(ctx: JobContext):
    prompts = load_session_prompts(
        ctx.job.metadata,
        default_system=DEFAULT_SYSTEM,
        default_greeting=DEFAULT_GREETING,
    )

    class DefaultAgent(Agent):
        def __init__(self) -> None:
            super().__init__(
                instructions=prompts.system,
                tools=[
                    EndCallTool(
                        extra_description="",
                        end_instructions="Thank the user for their time and say goodbye.",
                        delete_room=False,
                    ),
                ],
            )

        async def on_enter(self):
            await self.session.generate_reply(
                instructions=prompts.greeting,
                allow_interruptions=True,
            )

    session = AgentSession(
        stt=deepgram.STT(model="nova-3", language="en"),
        llm=openai.LLM(model="gpt-4o-mini"),
        tts=gradium.TTS(voice_id="4SZHfMpw-p46Ywgs"),
        turn_handling=TurnHandlingOptions(
            turn_detection=MultilingualModel(),
            preemptive_generation={"enabled": True},
        ),
        vad=silero.VAD.load(),
    )

    await session.start(agent=DefaultAgent(), room=ctx.room)

    background_audio = BackgroundAudioPlayer(
        ambient_sound=AudioConfig(BuiltinAudioClip.OFFICE_AMBIENCE, volume=1.0),
    )
    await background_audio.start(room=ctx.room, agent_session=session)


if __name__ == "__main__":
    cli.run_app(server)
