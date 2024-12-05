"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  Phone,
  Monitor,
  MonitorOff,
  Hand,
  Heart,
  ThumbsUp,
} from "lucide-react";
import { signalingApi } from "@/lib/supabase/api";
import { useUser } from "@/lib/hooks/use-user";

export function VideoConference({ roomId }: { roomId: string }) {
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [reactions, setReactions] = useState<{ type: string; count: number }[]>([
    { type: "hand", count: 0 },
    { type: "heart", count: 0 },
    { type: "like", count: 0 },
  ]);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const screenShareRef = useRef<HTMLVideoElement>(null);
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const signalingChannel = useRef<any>(null);
  const screenStream = useRef<MediaStream | null>(null);
  const { user } = useUser();

  useEffect(() => {
    if (!user) return;
    initializeMedia();
    return () => {
      cleanupConnection();
    };
  }, [user, roomId]);

  const initializeMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Initialize WebRTC peer connection
      peerConnection.current = new RTCPeerConnection({
        iceServers: [
          {
            urls: [
              "stun:stun.l.google.com:19302",
              "stun:stun1.l.google.com:19302",
            ],
          },
        ],
      });

      // Add local tracks to the peer connection
      stream.getTracks().forEach((track) => {
        if (peerConnection.current) {
          peerConnection.current.addTrack(track, stream);
        }
      });

      // Handle incoming tracks
      peerConnection.current.ontrack = (event) => {
        if (event.streams[0].getVideoTracks()[0].label.includes("screen")) {
          if (screenShareRef.current) {
            screenShareRef.current.srcObject = event.streams[0];
          }
        } else {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = event.streams[0];
          }
        }
      };

      // Connect to signaling server
      signalingChannel.current = await signalingApi.joinRoom(roomId, user.id);

      // Handle signaling events
      signalingChannel.current
        .on("broadcast", { event: "offer" }, async ({ payload }) => {
          if (!peerConnection.current) return;
          await peerConnection.current.setRemoteDescription(
            new RTCSessionDescription(payload)
          );
          const answer = await peerConnection.current.createAnswer();
          await peerConnection.current.setLocalDescription(answer);
          signalingApi.sendSignal(signalingChannel.current, "answer", answer);
        })
        .on("broadcast", { event: "answer" }, async ({ payload }) => {
          if (!peerConnection.current) return;
          await peerConnection.current.setRemoteDescription(
            new RTCSessionDescription(payload)
          );
        })
        .on("broadcast", { event: "ice-candidate" }, async ({ payload }) => {
          if (!peerConnection.current) return;
          await peerConnection.current.addIceCandidate(
            new RTCIceCandidate(payload)
          );
        })
        .on("broadcast", { event: "reaction" }, ({ payload }) => {
          handleReaction(payload.type);
        });

      // Handle ICE candidates
      peerConnection.current.onicecandidate = (event) => {
        if (event.candidate) {
          signalingApi.sendSignal(
            signalingChannel.current,
            "ice-candidate",
            event.candidate
          );
        }
      };

      setIsConnected(true);
    } catch (error) {
      console.error("Error initializing media:", error);
    }
  };

  const toggleScreenShare = async () => {
    try {
      if (isScreenSharing) {
        screenStream.current?.getTracks().forEach((track) => track.stop());
        screenStream.current = null;
        setIsScreenSharing(false);
      } else {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });
        screenStream.current = stream;
        
        if (screenShareRef.current) {
          screenShareRef.current.srcObject = stream;
        }

        // Add screen share track to peer connection
        stream.getTracks().forEach((track) => {
          if (peerConnection.current) {
            peerConnection.current.addTrack(track, stream);
          }
        });

        setIsScreenSharing(true);

        // Handle stream end
        stream.getVideoTracks()[0].onended = () => {
          toggleScreenShare();
        };
      }
    } catch (error) {
      console.error("Error toggling screen share:", error);
    }
  };

  const sendReaction = (type: string) => {
    signalingApi.sendSignal(signalingChannel.current, "reaction", { type });
    handleReaction(type);
  };

  const handleReaction = (type: string) => {
    setReactions((prev) =>
      prev.map((reaction) =>
        reaction.type === type
          ? { ...reaction, count: reaction.count + 1 }
          : reaction
      )
    );

    // Reset count after 3 seconds
    setTimeout(() => {
      setReactions((prev) =>
        prev.map((reaction) =>
          reaction.type === type
            ? { ...reaction, count: Math.max(0, reaction.count - 1) }
            : reaction
        )
      );
    }, 3000);
  };

  const cleanupConnection = () => {
    if (localVideoRef.current?.srcObject) {
      const stream = localVideoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
    }
    if (screenStream.current) {
      screenStream.current.getTracks().forEach((track) => track.stop());
    }
    if (peerConnection.current) {
      peerConnection.current.close();
    }
    if (signalingChannel.current) {
      signalingChannel.current.unsubscribe();
    }
    setIsConnected(false);
    setIsScreenSharing(false);
  };

  const toggleAudio = () => {
    if (localVideoRef.current?.srcObject) {
      const stream = localVideoRef.current.srcObject as MediaStream;
      stream.getAudioTracks().forEach((track) => {
        track.enabled = !isAudioEnabled;
      });
      setIsAudioEnabled(!isAudioEnabled);
    }
  };

  const toggleVideo = () => {
    if (localVideoRef.current?.srcObject) {
      const stream = localVideoRef.current.srcObject as MediaStream;
      stream.getVideoTracks().forEach((track) => {
        track.enabled = !isVideoEnabled;
      });
      setIsVideoEnabled(!isVideoEnabled);
    }
  };

  const endCall = () => {
    cleanupConnection();
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Local Video</CardTitle>
            <CardDescription>Your camera feed</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative aspect-video rounded-lg bg-muted">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="h-full w-full rounded-lg object-cover"
              />
              {!isConnected && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
                  <p className="text-muted-foreground">Connecting...</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Remote Video</CardTitle>
            <CardDescription>Other participant's feed</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative aspect-video rounded-lg bg-muted">
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="h-full w-full rounded-lg object-cover"
              />
              {!isConnected && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
                  <p className="text-muted-foreground">Waiting for participant...</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {isScreenSharing && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Screen Share</CardTitle>
              <CardDescription>Shared screen content</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative aspect-video rounded-lg bg-muted">
                <video
                  ref={screenShareRef}
                  autoPlay
                  playsInline
                  className="h-full w-full rounded-lg object-cover"
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="fixed bottom-8 left-1/2 flex -translate-x-1/2 space-x-4 rounded-full bg-background/80 p-4 backdrop-blur-sm">
        <Button
          variant={isAudioEnabled ? "outline" : "destructive"}
          size="icon"
          onClick={toggleAudio}
        >
          {isAudioEnabled ? (
            <Mic className="h-4 w-4" />
          ) : (
            <MicOff className="h-4 w-4" />
          )}
        </Button>
        <Button
          variant={isVideoEnabled ? "outline" : "destructive"}
          size="icon"
          onClick={toggleVideo}
        >
          {isVideoEnabled ? (
            <VideoIcon className="h-4 w-4" />
          ) : (
            <VideoOff className="h-4 w-4" />
          )}
        </Button>
        <Button
          variant={isScreenSharing ? "destructive" : "outline"}
          size="icon"
          onClick={toggleScreenShare}
        >
          {isScreenSharing ? (
            <MonitorOff className="h-4 w-4" />
          ) : (
            <Monitor className="h-4 w-4" />
          )}
        </Button>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => sendReaction("hand")}
          >
            <Hand className="h-4 w-4" />
            {reactions[0].count > 0 && (
              <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-yellow-500 text-xs text-white flex items-center justify-center">
                {reactions[0].count}
              </span>
            )}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => sendReaction("heart")}
          >
            <Heart className="h-4 w-4" />
            {reactions[1].count > 0 && (
              <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-red-500 text-xs text-white flex items-center justify-center">
                {reactions[1].count}
              </span>
            )}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => sendReaction("like")}
          >
            <ThumbsUp className="h-4 w-4" />
            {reactions[2].count > 0 && (
              <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-blue-500 text-xs text-white flex items-center justify-center">
                {reactions[2].count}
              </span>
            )}
          </Button>
        </div>
        <Button variant="destructive" size="icon" onClick={endCall}>
          <Phone className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
