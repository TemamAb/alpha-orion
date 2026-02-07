terraform {
  backend "gcs" {
    bucket  = "alpha-orion-tfstate"
    prefix  = "terraform/state/prod"
  }
}