terraform {
  backend "gcs" {
    bucket  = "alpha-orion-485207-tfstate"
    prefix  = "terraform/state/prod"
  }
}
