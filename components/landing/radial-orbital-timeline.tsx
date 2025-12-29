"use client";
import { useEffect, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Link, Zap } from "lucide-react";
import Image from "next/image";

interface TimelineItem {
  id: number;
  title: string;
  description: string;
  category: string;
  logo: string;
  relatedIds: number[];
  status: "available" | "coming-soon" | "beta";
  adoption: number;
}

interface RadialOrbitalTimelineProps {
  timelineData: TimelineItem[];
}

export default function RadialOrbitalTimeline({
  timelineData,
}: RadialOrbitalTimelineProps) {
  const [expandedItems, setExpandedItems] = useState<Record<number, boolean>>(
    {}
  );
  const [viewMode, _setViewMode] = useState<"orbital">("orbital");
  const [rotationAngle, setRotationAngle] = useState<number>(0);
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [pulseEffect, setPulseEffect] = useState<Record<number, boolean>>({});
  const [centerOffset, _setCenterOffset] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const [activeNodeId, setActiveNodeId] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const orbitRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === containerRef.current || e.target === orbitRef.current) {
      setExpandedItems({});
      setActiveNodeId(null);
      setPulseEffect({});
      setAutoRotate(true);
    }
  };

  const toggleItem = (id: number) => {
    setExpandedItems((prev) => {
      const newState = { ...prev };
      Object.keys(newState).forEach((key) => {
        if (parseInt(key) !== id) {
          newState[parseInt(key)] = false;
        }
      });

      newState[id] = !prev[id];

      if (!prev[id]) {
        setActiveNodeId(id);
        setAutoRotate(false);

        const relatedItems = getRelatedItems(id);
        const newPulseEffect: Record<number, boolean> = {};
        relatedItems.forEach((relId) => {
          newPulseEffect[relId] = true;
        });
        setPulseEffect(newPulseEffect);

        centerViewOnNode(id);
      } else {
        setActiveNodeId(null);
        setAutoRotate(true);
        setPulseEffect({});
      }

      return newState;
    });
  };

  useEffect(() => {
    let rotationTimer: NodeJS.Timeout;

    if (autoRotate && viewMode === "orbital") {
      rotationTimer = setInterval(() => {
        setRotationAngle((prev) => {
          const newAngle = (prev + 0.3) % 360;
          return Number(newAngle.toFixed(3));
        });
      }, 50);
    }

    return () => {
      if (rotationTimer) {
        clearInterval(rotationTimer);
      }
    };
  }, [autoRotate, viewMode]);

  const centerViewOnNode = (nodeId: number) => {
    if (viewMode !== "orbital" || !nodeRefs.current[nodeId]) return;

    const nodeIndex = timelineData.findIndex((item) => item.id === nodeId);
    const totalNodes = timelineData.length;
    const targetAngle = (nodeIndex / totalNodes) * 360;

    setRotationAngle(270 - targetAngle);
  };

  const calculateNodePosition = (index: number, total: number) => {
    const angle = ((index / total) * 360 + rotationAngle) % 360;
    const radius = 200;
    const radian = (angle * Math.PI) / 180;

    const x = radius * Math.cos(radian) + centerOffset.x;
    const y = radius * Math.sin(radian) + centerOffset.y;

    const zIndex = Math.round(100 + 50 * Math.cos(radian));
    const opacity = Math.max(
      0.4,
      Math.min(1, 0.4 + 0.6 * ((1 + Math.sin(radian)) / 2))
    );

    return { x, y, angle, zIndex, opacity };
  };

  const getRelatedItems = (itemId: number): number[] => {
    const currentItem = timelineData.find((item) => item.id === itemId);
    return currentItem ? currentItem.relatedIds : [];
  };

  const isRelatedToActive = (itemId: number): boolean => {
    if (!activeNodeId) return false;
    const relatedItems = getRelatedItems(activeNodeId);
    return relatedItems.includes(itemId);
  };

  const getStatusStyles = (status: TimelineItem["status"]): string => {
    switch (status) {
      case "available":
        return "text-primary-foreground bg-primary border-primary";
      case "beta":
        return "text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400 border-orange-500";
      case "coming-soon":
        return "text-muted-foreground bg-muted border-border";
      default:
        return "text-muted-foreground bg-muted border-border";
    }
  };

  return (
    <div
      className="bg-background flex min-h-[600px] w-full flex-col items-center justify-center overflow-hidden"
      ref={containerRef}
      onClick={handleContainerClick}
    >
      <div className="relative flex h-full w-full max-w-4xl items-center justify-center">
        <div
          className="absolute flex h-full w-full items-center justify-center"
          ref={orbitRef}
          style={{
            perspective: "1000px",
            transform: `translate(${centerOffset.x}px, ${centerOffset.y}px)`,
          }}
        >
          <div className="bg-card/80 border-primary/30 absolute z-10 flex h-20 w-20 animate-pulse items-center justify-center rounded-full border-2 shadow-lg backdrop-blur-md">
            <div className="border-primary/20 absolute h-24 w-24 animate-ping rounded-full border opacity-70"></div>
            <div
              className="border-primary/10 absolute h-28 w-28 animate-ping rounded-full border opacity-50"
              style={{ animationDelay: "0.5s" }}
            ></div>
            <div className="relative h-12 w-12 overflow-hidden rounded-lg">
              <Image
                src="/images/logo-light.png"
                alt="Stellar Tools"
                width={48}
                height={48}
                className="h-full w-full object-contain dark:hidden"
              />
              <Image
                src="/images/logo-dark.png"
                alt="Stellar Tools"
                width={48}
                height={48}
                className="hidden h-full w-full object-contain dark:block"
              />
            </div>
          </div>

          <div className="border-border absolute h-96 w-96 rounded-full border"></div>

          {timelineData.map((item, index) => {
            const position = calculateNodePosition(index, timelineData.length);
            const isExpanded = expandedItems[item.id];
            const isRelated = isRelatedToActive(item.id);
            const isPulsing = pulseEffect[item.id];

            const nodeStyle = {
              transform: `translate(${position.x}px, ${position.y}px)`,
              zIndex: isExpanded ? 200 : position.zIndex,
              opacity: isExpanded ? 1 : position.opacity,
            };

            return (
              <div
                key={item.id}
                ref={(el) => {
                  nodeRefs.current[item.id] = el;
                }}
                className="absolute cursor-pointer transition-all duration-700"
                style={nodeStyle}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleItem(item.id);
                }}
              >
                <div
                  className={`absolute -inset-1 rounded-full ${
                    isPulsing ? "animate-pulse duration-1000" : ""
                  }`}
                  style={{
                    background: `radial-gradient(circle, hsl(var(--primary) / 0.2) 0%, hsl(var(--primary) / 0) 70%)`,
                    width: `${item.adoption * 0.5 + 40}px`,
                    height: `${item.adoption * 0.5 + 40}px`,
                    left: `-${(item.adoption * 0.5 + 40 - 40) / 2}px`,
                    top: `-${(item.adoption * 0.5 + 40 - 40) / 2}px`,
                  }}
                ></div>

                <div
                  className={`bg-card flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg border-2 ${
                    isExpanded
                      ? "border-primary shadow-primary/30 shadow-lg"
                      : isRelated
                        ? "border-primary/50 animate-pulse"
                        : "border-border"
                  } transform transition-all duration-300 ${isExpanded ? "scale-150" : ""} `}
                >
                  <Image
                    src={item.logo}
                    alt={item.title}
                    width={32}
                    height={32}
                    className="h-full w-full object-contain p-1"
                  />
                </div>

                <div
                  className={`absolute top-14 text-xs font-semibold tracking-wider whitespace-nowrap transition-all duration-300 ${isExpanded ? "text-foreground scale-125" : "text-muted-foreground"} `}
                >
                  {item.title}
                </div>

                {isExpanded && (
                  <Card className="bg-card border-border absolute top-24 left-1/2 w-72 -translate-x-1/2 overflow-visible shadow-xl backdrop-blur-lg">
                    <div className="bg-border absolute -top-3 left-1/2 h-3 w-px -translate-x-1/2"></div>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <Badge
                          className={`px-2 text-xs ${getStatusStyles(
                            item.status
                          )}`}
                        >
                          {item.status === "available"
                            ? "AVAILABLE"
                            : item.status === "beta"
                              ? "BETA"
                              : "COMING SOON"}
                        </Badge>
                        <span className="text-muted-foreground font-mono text-xs">
                          {item.category}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <div className="bg-muted flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg">
                          <Image
                            src={item.logo}
                            alt={item.title}
                            width={24}
                            height={24}
                            className="h-full w-full object-contain p-1"
                          />
                        </div>
                        <CardTitle className="text-sm">{item.title}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="text-muted-foreground text-xs">
                      <p>{item.description}</p>

                      <div className="border-border mt-4 border-t pt-3">
                        <div className="mb-1 flex items-center justify-between text-xs">
                          <span className="text-foreground flex items-center">
                            <Zap size={10} className="text-primary mr-1" />
                            Adoption Rate
                          </span>
                          <span className="text-foreground font-mono">
                            {item.adoption}%
                          </span>
                        </div>
                        <div className="bg-muted h-1 w-full overflow-hidden rounded-full">
                          <div
                            className="bg-primary h-full"
                            style={{ width: `${item.adoption}%` }}
                          ></div>
                        </div>
                      </div>

                      {item.relatedIds.length > 0 && (
                        <div className="border-border mt-4 border-t pt-3">
                          <div className="mb-2 flex items-center">
                            <Link
                              size={10}
                              className="text-muted-foreground mr-1"
                            />
                            <h4 className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                              Related Integrations
                            </h4>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {item.relatedIds.map((relatedId) => {
                              const relatedItem = timelineData.find(
                                (i) => i.id === relatedId
                              );
                              return (
                                <Button
                                  key={relatedId}
                                  variant="outline"
                                  size="sm"
                                  className="border-border hover:bg-muted text-muted-foreground hover:text-foreground flex h-6 items-center rounded bg-transparent px-2 py-0 text-xs transition-all"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleItem(relatedId);
                                  }}
                                >
                                  {relatedItem?.title}
                                  <ArrowRight
                                    size={8}
                                    className="text-muted-foreground ml-1"
                                  />
                                </Button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
