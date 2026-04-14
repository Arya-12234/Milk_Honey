"""
Community Support — forum posts, replies, resources, and AI-powered
recommendations generated from plant disease detection history.
"""
from django.db import models
from rest_framework import serializers, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from accounts.models import User


# ── Models ──────────────────────────────────────────────────────────────

class ForumPost(models.Model):
    CATEGORY_CHOICES = [
        ("general",     "General Discussion"),
        ("disease",     "Plant Disease"),
        ("irrigation",  "Irrigation"),
        ("soil",        "Soil Health"),
        ("pest",        "Pest Control"),
        ("yield",       "Yield Improvement"),
        ("weather",     "Weather"),
    ]
    author       = models.ForeignKey(User, on_delete=models.CASCADE, related_name="forum_posts")
    title        = models.CharField(max_length=200)
    body         = models.TextField()
    category     = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default="general")
    image        = models.ImageField(upload_to="forum/", null=True, blank=True)
    upvotes      = models.PositiveIntegerField(default=0)
    is_pinned    = models.BooleanField(default=False)
    created_at   = models.DateTimeField(auto_now_add=True)
    updated_at   = models.DateTimeField(auto_now=True)

    class Meta:
        app_label = "ml_engine"
        ordering  = ["-is_pinned", "-created_at"]

    def __str__(self):
        return f"{self.title} by {self.author.email}"


class ForumReply(models.Model):
    post       = models.ForeignKey(ForumPost, on_delete=models.CASCADE, related_name="replies")
    author     = models.ForeignKey(User, on_delete=models.CASCADE, related_name="forum_replies")
    body       = models.TextField()
    upvotes    = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        app_label = "ml_engine"
        ordering  = ["created_at"]


class TrainingResource(models.Model):
    RESOURCE_TYPES = [
        ("guide",  "Guide"),
        ("course", "Course"),
        ("video",  "Video"),
        ("pdf",    "PDF"),
    ]
    title         = models.CharField(max_length=200)
    description   = models.TextField(blank=True)
    url           = models.URLField(blank=True)
    resource_type = models.CharField(max_length=10, choices=RESOURCE_TYPES, default="guide")
    is_featured   = models.BooleanField(default=False)
    created_at    = models.DateTimeField(auto_now_add=True)

    class Meta:
        app_label = "ml_engine"
        ordering  = ["-is_featured", "title"]

    def __str__(self):
        return self.title


class UserContribution(models.Model):
    """Leaderboard — counts posts + replies per user."""
    user             = models.OneToOneField(User, on_delete=models.CASCADE, related_name="contribution")
    post_count       = models.PositiveIntegerField(default=0)
    reply_count      = models.PositiveIntegerField(default=0)
    helpful_count    = models.PositiveIntegerField(default=0)
    badge            = models.CharField(max_length=50, blank=True)

    class Meta:
        app_label = "ml_engine"

    @property
    def total(self):
        return self.post_count + self.reply_count + self.helpful_count

    def __str__(self):
        return f"{self.user.email} — {self.total} contributions"


# ── Serializers ─────────────────────────────────────────────────────────

class ForumReplySerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source="author.full_name", read_only=True)

    class Meta:
        model  = ForumReply
        fields = ["id", "post", "author", "author_name", "body", "upvotes", "created_at"]
        read_only_fields = ["author", "upvotes", "created_at"]


class ForumPostSerializer(serializers.ModelSerializer):
    author_name  = serializers.CharField(source="author.full_name", read_only=True)
    reply_count  = serializers.IntegerField(source="replies.count", read_only=True)
    category_display = serializers.CharField(source="get_category_display", read_only=True)

    class Meta:
        model  = ForumPost
        fields = [
            "id", "author", "author_name", "title", "body",
            "category", "category_display", "upvotes", "is_pinned",
            "reply_count", "image", "created_at", "updated_at",
        ]
        read_only_fields = ["author", "upvotes", "is_pinned", "created_at", "updated_at"]


class TrainingResourceSerializer(serializers.ModelSerializer):
    class Meta:
        model  = TrainingResource
        fields = "__all__"


class UserContributionSerializer(serializers.ModelSerializer):
    user_name  = serializers.CharField(source="user.full_name", read_only=True)
    total      = serializers.IntegerField(read_only=True)

    class Meta:
        model  = UserContribution
        fields = ["user", "user_name", "post_count", "reply_count", "helpful_count", "total", "badge"]


# ── Views ────────────────────────────────────────────────────────────────

class ForumPostListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = ForumPost.objects.all()
        category = request.query_params.get("category")
        search   = request.query_params.get("q")
        if category:
            qs = qs.filter(category=category)
        if search:
            qs = qs.filter(title__icontains=search) | qs.filter(body__icontains=search)
        return Response(ForumPostSerializer(qs[:30], many=True).data)

    def post(self, request):
        serializer = ForumPostSerializer(data=request.data)
        if serializer.is_valid():
            post = serializer.save(author=request.user)
            # Update contribution counter
            contrib, _ = UserContribution.objects.get_or_create(user=request.user)
            contrib.post_count += 1
            contrib.save()
            return Response(ForumPostSerializer(post).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ForumPostDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            post = ForumPost.objects.get(pk=pk)
        except ForumPost.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        replies = ForumReply.objects.filter(post=post)
        return Response({
            "post":    ForumPostSerializer(post).data,
            "replies": ForumReplySerializer(replies, many=True).data,
        })

    def post(self, request, pk):
        """Add a reply."""
        try:
            post = ForumPost.objects.get(pk=pk)
        except ForumPost.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        reply = ForumReply.objects.create(
            post=post, author=request.user, body=request.data.get("body", "")
        )
        contrib, _ = UserContribution.objects.get_or_create(user=request.user)
        contrib.reply_count += 1
        contrib.save()
        return Response(ForumReplySerializer(reply).data, status=status.HTTP_201_CREATED)


class CommunityDashboardView(APIView):
    """Single endpoint powering the Community Hub card on the dashboard."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        recent_posts    = ForumPost.objects.all()[:5]
        resources       = TrainingResource.objects.filter(is_featured=True)[:5]
        top_contributors = (
            UserContribution.objects
            .select_related("user")
            .order_by("-post_count", "-reply_count")[:5]
        )
        # AI recommendations: pull from user's latest disease prediction
        ai_rec = None
        try:
            from .models import PlantDiseasePrediction
            pred = PlantDiseasePrediction.objects.filter(user=request.user).first()
            if pred and not pred.is_healthy:
                ai_rec = {
                    "disease":        pred.predicted_class,
                    "recommendation": pred.recommendation,
                    "confidence":     pred.confidence,
                }
        except Exception:
            pass

        return Response({
            "recent_posts":      ForumPostSerializer(recent_posts, many=True).data,
            "resources":         TrainingResourceSerializer(resources, many=True).data,
            "top_contributors":  UserContributionSerializer(top_contributors, many=True).data,
            "ai_recommendation": ai_rec,
            "category_choices":  ForumPost.CATEGORY_CHOICES,
        })


class UpvoteView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, model, pk):
        if model == "post":
            obj = ForumPost.objects.filter(pk=pk).first()
        elif model == "reply":
            obj = ForumReply.objects.filter(pk=pk).first()
        else:
            return Response(status=status.HTTP_400_BAD_REQUEST)
        if not obj:
            return Response(status=status.HTTP_404_NOT_FOUND)
        obj.upvotes += 1
        obj.save(update_fields=["upvotes"])
        return Response({"upvotes": obj.upvotes})


class TrainingResourceListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response(TrainingResourceSerializer(TrainingResource.objects.all(), many=True).data)
