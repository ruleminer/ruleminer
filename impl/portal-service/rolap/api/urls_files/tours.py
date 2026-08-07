from rest_framework.routers import DefaultRouter
from rolap.api.views.tours import CompletedToursView

tour_router = DefaultRouter()
tour_router.register(r"completed_tours", CompletedToursView,
                     basename="completed_tours")

urlpatterns = tour_router.urls
